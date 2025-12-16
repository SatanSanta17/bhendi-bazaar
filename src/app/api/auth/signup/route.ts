import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, mobile, password } = body as {
      name?: string;
      email?: string;
      mobile?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, mobile ? { mobile } : undefined].filter(
          Boolean,
        ) as any,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or mobile already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        mobile,
        passwordHash,
        profile: {
          create: {
            addresses: [],
          },
        },
      },
    });

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Signup error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}


