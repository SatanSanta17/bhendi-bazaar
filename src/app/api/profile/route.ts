import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import type { ProfileAddress, UserProfile } from "@/domain/profile";

interface ProfileResponse {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    mobile: string | null;
  };
  profile: UserProfile;
}

function normalizeAddresses(addresses: unknown): ProfileAddress[] {
  if (!addresses) return [];
  if (Array.isArray(addresses)) {
    return addresses as ProfileAddress[];
  }
  // In case something unexpected was stored, fall back safely.
  return [];
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const profile =
    user.profile ??
    (await prisma.profile.create({
      data: {
        userId: user.id,
        addresses: [],
      },
    }));

  const response: ProfileResponse = {
    user: {
      id: user.id,
      name: user.name ?? null,
      email: user.email ?? null,
      mobile: user.mobile ?? null,
    },
    profile: {
      id: profile.id,
      userId: profile.userId,
      profilePic: profile.profilePic,
      addresses: normalizeAddresses(profile.addresses),
    },
  };

  return NextResponse.json(response);
}

interface UpdateProfileBody {
  // User fields
  name?: string;
  email?: string;
  mobile?: string;
  // Profile fields
  profilePic?: string | null;
  addresses?: ProfileAddress[];
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  let body: UpdateProfileBody;
  try {
    body = (await req.json()) as UpdateProfileBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, email, mobile, profilePic, addresses } = body;

  // Update User table if user fields are provided
if (name !== undefined || email !== undefined || mobile !== undefined) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(mobile !== undefined && { mobile }),
    },
  });
}


  if (addresses && !Array.isArray(addresses)) {
    return NextResponse.json(
      { error: "addresses must be an array" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const nextProfile = await prisma.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      profilePic: profilePic ?? null,
      addresses: (addresses ?? []) as any,
    },
    update: {
      ...(profilePic !== undefined && { profilePic }),
      ...(addresses !== undefined && { addresses: addresses as any }),
    },
  });

  const response: ProfileResponse = {
    user: {
      id: user.id,
      name: user.name ?? null,
      email: user.email ?? null,
      mobile: user.mobile ?? null,
    },
    profile: {
      id: nextProfile.id,
      userId: nextProfile.userId,
      profilePic: nextProfile.profilePic,
      addresses: normalizeAddresses(nextProfile.addresses),
    },
  };

  return NextResponse.json(response);
}



