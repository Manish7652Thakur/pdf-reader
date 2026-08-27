import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "development_secret_do_not_use_in_prod";

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get("auth_token")?.value;
        if (!token) return NextResponse.json({ user: null }, { status: 200 });

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

        if (!user) return NextResponse.json({ user: null }, { status: 200 });

        return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ user: null }, { status: 200 });
    }
}
