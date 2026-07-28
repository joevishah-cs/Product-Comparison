import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      include: {
        brand: true,
        family: true,
        values: {
          include: {
            definition: true,
          },
        },
      },
    });

    // Transform to match UI expectations: flat attributes object
    const transformed = products.map((product) => {
      const attributes: Record<string, string> = {};
      for (const value of product.values) {
        attributes[value.definition.key] = value.normalizedValue || value.rawValue;
      }

      return {
        id: product.id,
        brand: product.brand.name,
        model: product.model,
        family: product.family?.name || "Unknown",
        equipmentType: "Inverter heat pump", // TODO: store in Product model if needed
        attributes,
        source: product.values[0]?.sourceLocation || "Database record",
      };
    });

    return NextResponse.json({ products: transformed });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
