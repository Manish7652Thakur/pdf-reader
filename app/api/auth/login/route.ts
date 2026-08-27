import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "development_secret_do_not_use_in_prod";

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();
        if (!email || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
        response.cookies.set("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7
        });

        return response;
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
