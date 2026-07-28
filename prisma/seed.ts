import { PrismaClient } from "@prisma/client";
import { INGESTED_DATA } from "../lib/data/ingestedData";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with ingested product data...");

  // Create/update source documents
  const pdfSource = await prisma.sourceDocument.upsert({
    where: { name: "Daikin FIT Battlecard.pdf" },
    update: { importedAt: new Date() },
    create: {
      name: "Daikin FIT Battlecard.pdf",
      type: "PDF",
      importedAt: new Date(),
    },
  });

  const xlsxSource = await prisma.sourceDocument.upsert({
    where: { name: "Competitor comparison.xlsx" },
    update: { importedAt: new Date() },
    create: {
      name: "Competitor comparison.xlsx",
      type: "XLSX",
      importedAt: new Date(),
    },
  });

  // Ingest products
  for (const product of INGESTED_DATA.products) {
    // Ensure brand exists
    const brand = await prisma.brand.upsert({
      where: { name: product.brand },
      update: {},
      create: { name: product.brand },
    });

    // Ensure product family exists (if present)
    let family = null;
    if (product.family) {
      family = await prisma.productFamily.upsert({
        where: { name: product.family },
        update: {},
        create: { name: product.family },
      });
    }

    // Create/update product
    const dbProduct = await prisma.product.upsert({
      where: { id: product.id },
      update: {
        model: product.model,
        brandId: brand.id,
        familyId: family?.id ?? null,
      },
      create: {
        id: product.id,
        model: product.model,
        brandId: brand.id,
        familyId: family?.id ?? null,
      },
    });

    // Determine which source document this came from
    const sourceDoc = product.source.includes("Battlecard") ? pdfSource : xlsxSource;

    // Ingest attributes
    for (const [attributeKey, attributeValue] of Object.entries(product.attributes)) {
      // Ensure attribute definition exists
      const definition = await prisma.attributeDefinition.upsert({
        where: { key: attributeKey },
        update: {},
        create: {
          key: attributeKey,
          label: attributeKey,
          category: categorizeAttribute(attributeKey),
          comparisonDirection: getComparisonDirection(attributeKey),
        },
      });

      // Extract numeric value if present
      const numericValue = extractNumericValue(attributeValue as string);

      // Create/update attribute value with provenance
      await prisma.productAttributeValue.upsert({
        where: {
          productId_definitionId: {
            productId: dbProduct.id,
            definitionId: definition.id,
          },
        },
        update: {
          rawValue: attributeValue as string,
          normalizedValue: attributeValue as string,
          sourceLocation: `${sourceDoc.name} • ${product.source}`,
          status: "available",
          confidence: "source-backed",
        },
        create: {
          productId: dbProduct.id,
          definitionId: definition.id,
          rawValue: attributeValue as string,
          normalizedValue: attributeValue as string,
          sourceLocation: `${sourceDoc.name} • ${product.source}`,
          status: "available",
          confidence: "source-backed",
        },
      });
    }
  }

  console.log(`✓ Seeded ${INGESTED_DATA.products.length} products`);
}

function categorizeAttribute(key: string): string {
  const category = key.toLowerCase();
  if (
    category.includes("seer") ||
    category.includes("eer") ||
    category.includes("hspf") ||
    category.includes("cop") ||
    category.includes("capacity") ||
    category.includes("efficiency")
  ) {
    return "Energy & Efficiency";
  }
  if (category.includes("sound") || category.includes("quiet") || category.includes("noise")) {
    return "Sound & Noise";
  }
  if (category.includes("warranty")) {
    return "Warranty & Support";
  }
  if (category.includes("install") || category.includes("range") || category.includes("line") || category.includes("charge")) {
    return "Installation & Controls";
  }
  if (category.includes("refrigerant") || category.includes("compressor") || category.includes("thermostat")) {
    return "Technical Specifications";
  }
  if (category.includes("cost")) {
    return "Cost";
  }
  return "Other";
}

function getComparisonDirection(key: string): string {
  const k = key.toLowerCase();
  if (k.includes("cost") || k.includes("price") || k.includes("sound") || k.includes("noise") || k.includes("heating operating") || k.includes("lowest")) {
    return "lower";
  }
  if (
    k.includes("seer") ||
    k.includes("eer") ||
    k.includes("hspf") ||
    k.includes("cop") ||
    k.includes("capacity") ||
    k.includes("warranty") ||
    k.includes("efficiency")
  ) {
    return "higher";
  }
  return "neutral";
}

function extractNumericValue(value: string): number | null {
  if (!value) return null;
  const match = value.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
