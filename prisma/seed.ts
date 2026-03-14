import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Restaurant Settings
  await prisma.restaurantSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      name: "The Kitchen",
      phone: "(555) 123-4567",
      address: "123 Main Street, Anytown, USA",
      isOpen: true,
      deliveryEnabled: true,
      deliveryRadiusMiles: 5.0,
      deliveryFeeFixed: 399,
      deliveryMinOrder: 1500,
      pickupEstimateMin: 15,
      pickupEstimateMax: 25,
      deliveryEstimateMin: 30,
      deliveryEstimateMax: 45,
      taxRate: 0.08,
    },
  });

  // Business Hours (Mon-Sun, 11am-10pm, closed on Monday)
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  for (let i = 0; i < 7; i++) {
    await prisma.businessHours.create({
      data: {
        settingsId: "singleton",
        dayOfWeek: i,
        openTime: "11:00",
        closeTime: "22:00",
        isClosed: i === 1, // Closed on Monday
      },
    });
  }

  // Categories
  const appetizers = await prisma.category.create({
    data: { name: "Appetizers", sortOrder: 0 },
  });

  const mains = await prisma.category.create({
    data: { name: "Main Course", sortOrder: 1 },
  });

  const sides = await prisma.category.create({
    data: { name: "Sides", sortOrder: 2 },
  });

  const drinks = await prisma.category.create({
    data: { name: "Drinks", sortOrder: 3 },
  });

  const desserts = await prisma.category.create({
    data: { name: "Desserts", sortOrder: 4 },
  });

  // Appetizers
  await prisma.menuItem.create({
    data: {
      categoryId: appetizers.id,
      name: "Crispy Spring Rolls",
      description: "Vegetable-filled spring rolls with sweet chili sauce",
      price: 899,
      tags: ["VEGETARIAN"],
      sortOrder: 0,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: appetizers.id,
      name: "Wings Platter",
      description: "Crispy chicken wings with your choice of sauce",
      price: 1299,
      tags: ["SPICY"],
      sortOrder: 1,
      modifierGroups: {
        create: {
          name: "Choose Sauce",
          required: true,
          minSelect: 1,
          maxSelect: 1,
          sortOrder: 0,
          modifiers: {
            create: [
              { name: "Buffalo Hot", priceAdjustment: 0, sortOrder: 0, isDefault: true },
              { name: "BBQ", priceAdjustment: 0, sortOrder: 1 },
              { name: "Garlic Parmesan", priceAdjustment: 0, sortOrder: 2 },
              { name: "Honey Sriracha", priceAdjustment: 50, sortOrder: 3 },
            ],
          },
        },
      },
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: appetizers.id,
      name: "Loaded Nachos",
      description: "Tortilla chips with melted cheese, jalapeños, sour cream, and guacamole",
      price: 1099,
      tags: ["VEGETARIAN", "GLUTEN_FREE"],
      sortOrder: 2,
    },
  });

  // Main Course
  const burger = await prisma.menuItem.create({
    data: {
      categoryId: mains.id,
      name: "Classic Smash Burger",
      description: "Double smashed patty, American cheese, pickles, special sauce on a brioche bun",
      price: 1499,
      sortOrder: 0,
      modifierGroups: {
        create: [
          {
            name: "Choose Size",
            required: true,
            minSelect: 1,
            maxSelect: 1,
            sortOrder: 0,
            modifiers: {
              create: [
                { name: "Single", priceAdjustment: -300, sortOrder: 0 },
                { name: "Double", priceAdjustment: 0, sortOrder: 1, isDefault: true },
                { name: "Triple", priceAdjustment: 300, sortOrder: 2 },
              ],
            },
          },
          {
            name: "Add Extras",
            required: false,
            minSelect: 0,
            maxSelect: 4,
            sortOrder: 1,
            modifiers: {
              create: [
                { name: "Bacon", priceAdjustment: 200, sortOrder: 0 },
                { name: "Avocado", priceAdjustment: 150, sortOrder: 1 },
                { name: "Fried Egg", priceAdjustment: 150, sortOrder: 2 },
                { name: "Extra Cheese", priceAdjustment: 100, sortOrder: 3 },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: mains.id,
      name: "Grilled Salmon",
      description: "Atlantic salmon with lemon butter sauce, served with roasted vegetables",
      price: 2199,
      tags: ["GLUTEN_FREE", "DAIRY_FREE"],
      sortOrder: 1,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: mains.id,
      name: "Mushroom Risotto",
      description: "Creamy arborio rice with wild mushrooms, parmesan, and truffle oil",
      price: 1699,
      tags: ["VEGETARIAN"],
      sortOrder: 2,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: mains.id,
      name: "Chicken Tikka Bowl",
      description: "Tandoori chicken, basmati rice, raita, pickled onions, and naan",
      price: 1599,
      tags: ["SPICY"],
      sortOrder: 3,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: mains.id,
      name: "Margherita Pizza",
      description: "San Marzano tomatoes, fresh mozzarella, basil on hand-tossed dough",
      price: 1399,
      tags: ["VEGETARIAN"],
      sortOrder: 4,
      modifierGroups: {
        create: {
          name: "Choose Size",
          required: true,
          minSelect: 1,
          maxSelect: 1,
          sortOrder: 0,
          modifiers: {
            create: [
              { name: "10\" Personal", priceAdjustment: 0, sortOrder: 0, isDefault: true },
              { name: "14\" Large", priceAdjustment: 400, sortOrder: 1 },
              { name: "18\" Family", priceAdjustment: 800, sortOrder: 2 },
            ],
          },
        },
      },
    },
  });

  // Sides
  await prisma.menuItem.create({
    data: {
      categoryId: sides.id,
      name: "Truffle Fries",
      description: "Crispy fries with truffle oil and parmesan",
      price: 699,
      tags: ["VEGETARIAN"],
      sortOrder: 0,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: sides.id,
      name: "Garden Salad",
      description: "Mixed greens, cherry tomatoes, cucumber, red onion with balsamic vinaigrette",
      price: 599,
      tags: ["VEGAN", "GLUTEN_FREE"],
      sortOrder: 1,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: sides.id,
      name: "Mac & Cheese",
      description: "Four-cheese blend with crispy breadcrumb topping",
      price: 799,
      tags: ["VEGETARIAN"],
      sortOrder: 2,
    },
  });

  // Drinks
  await prisma.menuItem.create({
    data: {
      categoryId: drinks.id,
      name: "Fresh Lemonade",
      description: "House-made lemonade with fresh mint",
      price: 449,
      tags: ["VEGAN", "GLUTEN_FREE"],
      sortOrder: 0,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: drinks.id,
      name: "Iced Coffee",
      description: "Cold brew with your choice of milk",
      price: 499,
      sortOrder: 1,
      modifierGroups: {
        create: {
          name: "Choose Milk",
          required: true,
          minSelect: 1,
          maxSelect: 1,
          sortOrder: 0,
          modifiers: {
            create: [
              { name: "Regular Milk", priceAdjustment: 0, sortOrder: 0, isDefault: true },
              { name: "Oat Milk", priceAdjustment: 75, sortOrder: 1 },
              { name: "Almond Milk", priceAdjustment: 75, sortOrder: 2 },
            ],
          },
        },
      },
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: drinks.id,
      name: "Craft Soda",
      description: "Artisanal sodas in various flavors",
      price: 399,
      sortOrder: 2,
    },
  });

  // Desserts
  await prisma.menuItem.create({
    data: {
      categoryId: desserts.id,
      name: "Chocolate Lava Cake",
      description: "Warm chocolate cake with a molten center, served with vanilla ice cream",
      price: 999,
      tags: ["VEGETARIAN"],
      sortOrder: 0,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: desserts.id,
      name: "New York Cheesecake",
      description: "Classic creamy cheesecake with berry compote",
      price: 899,
      tags: ["VEGETARIAN"],
      sortOrder: 1,
    },
  });

  // Promo Code
  await prisma.promoCode.create({
    data: {
      code: "WELCOME10",
      description: "10% off your first order",
      discountType: "PERCENTAGE",
      discountValue: 1000, // 10% in basis points
      minimumOrder: 2000, // $20 minimum
      maxUses: 100,
      isActive: true,
    },
  });

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
