
// Inserts SAMPLE products (prices and stock are placeholders - edit them in the admin panel)

const dns = require('node:dns');

// Configure DNS before connecting to MongoDB
dns.setServers(['8.8.8.8', '1.1.1.1']);

const connectDB = require('../config/db');
const Product = require('../models/Product');

const data = [
  {
    sku: 'GJ-250',
    category: 'gangajal',
    price: 99,
    stock: 100,
    size: '250 ml',
    featured: true,
    name: {
      en: 'Gangajal',
      mr: 'गंगाजल',
      hi: 'गंगाजल'
    },
    description: {
      en: 'Sacred Gangajal in a securely sealed bottle, for daily puja and rituals.',
      mr: 'दैनंदिन पूजा आणि धार्मिक विधींसाठी सुरक्षितपणे सीलबंद बाटलीतील पवित्र गंगाजल.',
      hi: 'दैनिक पूजा और धार्मिक अनुष्ठानों के लिए सुरक्षित रूप से सील बोतल में पवित्र गंगाजल।'
    }
  },
  {
    sku: 'TJ-250',
    category: 'trambakeshwar',
    price: 129,
    discountPrice: 119,
    stock: 100,
    size: '250 ml',
    featured: true,
    name: {
      en: 'Trambakeshwar Jal',
      mr: 'त्र्यंबकेश्वर जल',
      hi: 'त्र्यंबकेश्वर जल'
    },
    description: {
      en: 'Holy water from Trambakeshwar, Nashik, one of the twelve Jyotirlinga sites.',
      mr: 'बारा ज्योतिर्लिंगांपैकी एक असलेल्या त्र्यंबकेश्वर (नाशिक) येथील पवित्र जल.',
      hi: 'बारह ज्योतिर्लिंगों में से एक त्र्यंबकेश्वर (नाशिक) का पवित्र जल।'
    }
  },
  {
    sku: 'KM-500',
    category: 'kumbh',
    price: 199,
    stock: 60,
    size: '500 ml',
    featured: true,
    name: {
      en: 'Kumbh Mela Special Jal',
      mr: 'कुंभमेळा विशेष जल',
      hi: 'कुंभ मेला विशेष जल'
    },
    description: {
      en: 'A special edition holy water bottle commemorating the Nashik Kumbh Mela.',
      mr: 'नाशिक कुंभमेळ्याच्या स्मरणार्थ विशेष आवृत्तीची पवित्र जल बाटली.',
      hi: 'नाशिक कुंभ मेले की स्मृति में विशेष संस्करण की पवित्र जल बोतल।'
    }
  },
  {
    sku: 'GB-1L',
    category: 'gangajal',
    price: 249,
    stock: 50,
    size: '1 L',
    featured: false,
    name: {
      en: 'Gangajal Bottle',
      mr: 'गंगाजल बाटली',
      hi: 'गंगाजल बोतल'
    },
    description: {
      en: 'One litre Gangajal bottle, ideal for families and temples.',
      mr: 'कुटुंबांसाठी आणि मंदिरांसाठी योग्य, एक लिटर गंगाजल बाटली.',
      hi: 'परिवारों और मंदिरों के लिए उपयुक्त, एक लीटर गंगाजल बोतल।'
    }
  },
  {
    sku: 'GP-001',
    category: 'gift',
    price: 499,
    discountPrice: 449,
    stock: 30,
    size: 'Gift Pack',
    featured: true,
    name: {
      en: 'Holy Water Gift Pack',
      mr: 'पवित्र जल भेट पॅक',
      hi: 'पवित्र जल उपहार पैक'
    },
    description: {
      en: 'A gift pack with Gangajal and Trambakeshwar Jal, ideal for festivals and special occasions.',
      mr: 'गंगाजल आणि त्र्यंबकेश्वर जल असलेला भेट पॅक, सण आणि विशेष प्रसंगांसाठी उत्तम.',
      hi: 'गंगाजल और त्र्यंबकेश्वर जल वाला उपहार पैक, त्योहारों और विशेष अवसरों के लिए उत्तम।'
    }
  }
];

(async () => {
  await connectDB();

  for (const product of data) {
    const existingProduct = await Product.findOne({
      sku: product.sku
    });

    if (!existingProduct) {
      await Product.create(product);
      console.log(`Product added: ${product.sku}`);
    } else {
      console.log(`Product already exists: ${product.sku}`);
    }
  }

  console.log('Sample products ready');

  process.exit(0);
})().catch((error) => {
  console.error('Product seeding failed:', error.message);
  process.exit(1);
});
