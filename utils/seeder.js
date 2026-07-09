import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';

dotenv.config();

// Connect to database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sparex');

const categoriesData = [
  { name: 'Engine Parts', slug: 'engine-parts', description: 'Pistons, Spark Plugs, Filters, Valves, Gaskets, Belts' },
  { name: 'Brake System', slug: 'brake-system', description: 'Brake Pads, Rotors, Calipers, Master Cylinders' },
  { name: 'Suspension & Steering', slug: 'suspension-steering', description: 'Shock Absorbers, Control Arms, Ball Joints, Tie Rods' },
  { name: 'Electrical & Lighting', slug: 'electrical-lighting', description: 'Alternators, Starters, Bulbs, Headlights, Sensors' },
  { name: 'Transmission & Drivetrain', slug: 'transmission-drivetrain', description: 'Clutches, Gearbox parts, CV Axles, Flywheels' }
];

const brandsData = [
  { name: 'Toyota Genuine', slug: 'toyota-genuine', description: 'Original Equipment Manufacturer parts for Toyota vehicles.' },
  { name: 'Suzuki Genuine', slug: 'suzuki-genuine', description: 'Original Equipment Manufacturer parts for Suzuki vehicles.' },
  { name: 'Denso', slug: 'denso', description: 'Premium electrical and ignition systems from Japan.' },
  { name: 'Bosch', slug: 'bosch', description: 'German engineered high durability brakes and filters.' },
  { name: 'NGK Spark Plugs', slug: 'ngk', description: 'World leader in spark plugs and oxygen sensors.' }
];

const couponsData = [
  { code: 'WELCOME10', discountType: 'Percentage', discountAmount: 10, minPurchase: 1000, expiryDate: new Date('2027-12-31'), isActive: true },
  { code: 'SL500', discountType: 'FixedAmount', discountAmount: 500, minPurchase: 5000, expiryDate: new Date('2027-12-31'), isActive: true }
];

const importData = async () => {
  try {
    // Clear existing collections and drop them to remove old indexes
    const dropCollection = async (model) => {
      try {
        await model.collection.drop();
      } catch (err) {
        // Ignore if collection does not exist (code 26 / NamespaceNotFound)
        if (err.code !== 26) {
          console.warn(`Warning dropping collection: ${err.message}`);
        }
      }
    };

    await dropCollection(User);
    await dropCollection(Category);
    await dropCollection(Brand);
    await dropCollection(Product);
    await dropCollection(Coupon);

    console.log('Collections cleared and indexes reset.');

    // Seed default administrative users
    const adminUser = await User.create({
      name: 'SpareX Admin',
      email: 'admin@sparex.com',
      password: 'adminpassword123', // encrypted via User model pre-save hook
      role: 'Super Admin',
      phone: '0772557541',
      isVerified: true
    });

    const staffUser = await User.create({
      name: 'Inventory Staff Member',
      email: 'staff@sparex.com',
      password: 'staffpassword123',
      role: 'Inventory Staff',
      phone: '0772557542',
      isVerified: true
    });

    const supportUser = await User.create({
      name: 'Customer Support Agent',
      email: 'support@sparex.com',
      password: 'supportpassword123',
      role: 'Customer Support',
      phone: '0772557543',
      isVerified: true
    });

    const customerUser = await User.create({
      name: 'Kalhara Ediriweera',
      email: 'customer@sparex.com',
      password: 'customerpassword123',
      role: 'Customer',
      phone: '0772557544',
      referralCode: 'SPAREX-TEST',
      isVerified: true,
      addressBook: [
        { label: 'Home', street: 'No 45, Baseline Road', city: 'Colombo 08', state: 'Colombo', postalCode: '00800', isDefault: true }
      ]
    });

    console.log('Users seeded.');

    // Seed Categories
    const categories = await Category.insertMany(categoriesData);
    console.log('Categories seeded.');

    // Seed Brands
    const brands = await Brand.insertMany(brandsData);
    console.log('Brands seeded.');

    // Seed Coupons
    await Coupon.insertMany(couponsData);
    console.log('Coupons seeded.');

    // Map names to inserted ObjectIds
    const engineCat = categories.find(c => c.slug === 'engine-parts');
    const brakeCat = categories.find(c => c.slug === 'brake-system');
    const suspensionCat = categories.find(c => c.slug === 'suspension-steering');

    const toyotaBrand = brands.find(b => b.slug === 'toyota-genuine');
    const suzukiBrand = brands.find(b => b.slug === 'suzuki-genuine');
    const densoBrand = brands.find(b => b.slug === 'denso');
    const boschBrand = brands.find(b => b.slug === 'bosch');
    const ngkBrand = brands.find(b => b.slug === 'ngk');

    // Seed Products
    const productsData = [
      {
        title: 'Toyota Genuine Cabin Air Filter',
        description: 'Premium activated charcoal air filter for maintaining fresh cabin airflow. Fits Toyota Prius, Aqua, and Vitz models.',
        slug: 'toyota-cabin-air-filter',
        sku: 'FLT-TY-1024',
        partNumber: '87139-30040',
        oemNumber: '87139-58010',
        price: 3450,
        discountPrice: 2950,
        stock: 45,
        brand: toyotaBrand._id,
        category: engineCat._id,
        condition: 'New',
        originCountry: 'Japan',
        warranty: '6 Months Manufacturer Warranty',
        images: ['/uploads/products/cabin-filter.jpg'],
        specifications: [
          { key: 'Material', value: 'Activated Carbon Fiber' },
          { key: 'Dimensions', value: '215mm x 194mm x 29mm' }
        ],
        compatibility: [
          { make: 'Toyota', model: 'Prius', yearStart: 2012, yearEnd: 2021, engine: '2ZR-FXE', transmission: 'CVT', fuelType: 'Hybrid' },
          { make: 'Toyota', model: 'Aqua', yearStart: 2012, yearEnd: 2020, engine: '1NZ-FXE', transmission: 'CVT', fuelType: 'Hybrid' },
          { make: 'Toyota', model: 'Vitz', yearStart: 2010, yearEnd: 2020, engine: '1KR-FE', transmission: 'Automatic', fuelType: 'Petrol' }
        ],
        createdBy: adminUser._id
      },
      {
        title: 'NGK Laser Iridium Spark Plug Set (4pcs)',
        description: 'High performance Laser Iridium spark plugs. Delivers stable ignition, high fuel efficiency, and long lifespan. Designed for Japanese hybrid vehicles.',
        slug: 'ngk-iridium-spark-plug-set',
        sku: 'SPK-NG-0092',
        partNumber: 'DF7H-11B',
        oemNumber: '90919-01275',
        price: 18500,
        discountPrice: 16900,
        stock: 20,
        brand: ngkBrand._id,
        category: engineCat._id,
        condition: 'New',
        originCountry: 'Japan',
        warranty: '1 Year Warranty',
        images: ['/uploads/products/spark-plug.jpg'],
        specifications: [
          { key: 'Thread Diameter', value: '12mm' },
          { key: 'Heat Range', value: '7' },
          { key: 'Electrode Core', value: 'Iridium Center, Platinum Ground' }
        ],
        compatibility: [
          { make: 'Toyota', model: 'Prius', yearStart: 2010, yearEnd: 2018, engine: '2ZR-FXE', transmission: 'CVT', fuelType: 'Hybrid' },
          { make: 'Toyota', model: 'Aqua', yearStart: 2012, yearEnd: 2019, engine: '1NZ-FXE', transmission: 'CVT', fuelType: 'Hybrid' }
        ],
        createdBy: adminUser._id
      },
      {
        title: 'Bosch Premium Front Brake Pad Set',
        description: 'Bosch non-asbestos organic brake pads offer low noise, low dust output, and excellent heat dissipation for safe braking under hot Sri Lankan road conditions.',
        slug: 'bosch-front-brake-pads-suzuki-wagonr',
        sku: 'BRK-BS-4029',
        partNumber: 'BP-SU-9302',
        oemNumber: '55810-72M50',
        price: 8750,
        discountPrice: 0,
        stock: 15,
        brand: boschBrand._id,
        category: brakeCat._id,
        condition: 'New',
        originCountry: 'Germany',
        warranty: 'No Warranty',
        images: ['/uploads/products/brake-pads.jpg'],
        specifications: [
          { key: 'Position', value: 'Front Axle' },
          { key: 'Friction Material Type', value: 'Ceramic' }
        ],
        compatibility: [
          { make: 'Suzuki', model: 'Wagon R', yearStart: 2013, yearEnd: 2022, engine: 'R06A', transmission: 'Automatic', fuelType: 'Petrol' },
          { make: 'Suzuki', model: 'Alto', yearStart: 2015, yearEnd: 2022, engine: 'R06A', transmission: 'Manual', fuelType: 'Petrol' }
        ],
        createdBy: adminUser._id
      },
      {
        title: 'Denso Alternator Assembly',
        description: 'Brand new high performance Denso alternator. 12V 90A, fully compatible with Toyota Corolla and Axio models.',
        slug: 'denso-alternator-toyota-corolla',
        sku: 'ALT-DN-7731',
        partNumber: '104210-2780',
        oemNumber: '27060-37080',
        price: 68000,
        discountPrice: 62000,
        stock: 4,
        brand: densoBrand._id,
        category: engineCat._id,
        condition: 'New',
        originCountry: 'Japan',
        warranty: '6 Months Warranty',
        images: ['/uploads/products/alternator.jpg'],
        specifications: [
          { key: 'Output Voltage', value: '12V' },
          { key: 'Output Amperage', value: '90A' }
        ],
        compatibility: [
          { make: 'Toyota', model: 'Axio', yearStart: 2012, yearEnd: 2020, engine: '1NZ-FE', transmission: 'CVT', fuelType: 'Petrol' },
          { make: 'Toyota', model: 'Corolla', yearStart: 2008, yearEnd: 2018, engine: '1NZ-FE', transmission: 'Automatic', fuelType: 'Petrol' }
        ],
        createdBy: adminUser._id
      },
      {
        title: 'Suzuki Genuine Rear Shock Absorber',
        description: 'Original equipment shock absorber designed for Suzuki Wagon R Stingray. Provides maximum ride stability and comfort.',
        slug: 'suzuki-rear-shock-absorber',
        sku: 'SUS-SZ-9304',
        partNumber: '41800-72M00',
        oemNumber: '41800-72M10',
        price: 14200,
        discountPrice: 12800,
        stock: 12,
        brand: suzukiBrand._id,
        category: suspensionCat._id,
        condition: 'New',
        originCountry: 'Japan',
        warranty: '3 Months Warranty',
        images: ['/uploads/products/shock-absorber.jpg'],
        specifications: [
          { key: 'Position', value: 'Rear LH/RH' },
          { key: 'Damper Type', value: 'Gas Pressurized' }
        ],
        compatibility: [
          { make: 'Suzuki', model: 'Wagon R', yearStart: 2013, yearEnd: 2020, engine: 'R06A', transmission: 'Automatic', fuelType: 'Hybrid' }
        ],
        createdBy: adminUser._id
      }
    ];

    await Product.insertMany(productsData);
    console.log('Products seeded.');

    console.log('Database import succeeded!');
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

importData();
