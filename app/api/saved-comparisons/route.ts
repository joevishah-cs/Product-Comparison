import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

const DEMO_EMAIL = process.env.DEMO_EMAIL || "demo@daikin.com";

async function getDemoUser() {
  return prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, name: "Demo Sales" },
  });
}

export async function GET() {
  try {
    const user = await getDemoUser();
    const saved = await prisma.savedComparison.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      comparisons: saved.map((s) => ({
        id: s.id,
        name: s.name,
        productIds: JSON.parse(s.productIds || "[]"),
        notes: s.notes,
        hasDashboard: !!s.dashboard,
        hasInsights: !!s.insights,
        hasBattlecard: !!s.battlecard,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error listing saved comparisons:", error);
    return NextResponse.json({ error: "Failed to list saved comparisons" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, productIds, notes, insights, battlecard } = body;

    if (!name || !Array.isArray(productIds) || productIds.length < 2) {
      return NextResponse.json({ error: "name and at least 2 productIds are required" }, { status: 400 });
    }

    const user = await getDemoUser();

    const saved = await prisma.savedComparison.create({
      data: {
        name,
        userId: user.id,
        productIds: JSON.stringify(productIds),
        notes: notes || null,
        insights: insights || null,
        battlecard: battlecard || null,
      },
    });

    return NextResponse.json({ id: saved.id });
  } catch (error) {
    console.error("Error saving comparison:", error);
    return NextResponse.json({ error: "Failed to save comparison" }, { status: 500 });
  }
}
