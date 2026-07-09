import Cms from '../models/Cms.js';

// @desc    Get CMS value by key
// @route   GET /api/cms/:key
// @access  Public
export const getCmsSettings = async (req, res, next) => {
  try {
    const cms = await Cms.findOne({ key: req.params.key });
    if (!cms) {
      return res.json({ success: true, value: getDefaultCmsValue(req.params.key) });
    }
    res.json({ success: true, value: cms.value });
  } catch (error) {
    next(error);
  }
};

// @desc    Update CMS value by key (Admin)
// @route   PUT /api/cms/:key
// @access  Private (Admin, Manager)
export const updateCmsSettings = async (req, res, next) => {
  const { value } = req.body;
  try {
    let cms = await Cms.findOne({ key: req.params.key });

    if (cms) {
      cms.value = value;
      await cms.save();
    } else {
      cms = await Cms.create({ key: req.params.key, value });
    }

    res.json({ success: true, message: `CMS key '${req.params.key}' updated successfully.`, value: cms.value });
  } catch (error) {
    next(error);
  }
};

// Helpers for default configurations
const getDefaultCmsValue = (key) => {
  switch (key) {
    case 'hero_slider':
      return [
        {
          title: 'Premium Genuine Spare Parts',
          subtitle: 'Keep your vehicle running like new with SpareX components.',
          image: '/uploads/products/banner1.jpg',
          link: '/shop'
        },
        {
          title: 'Uncompromising Safety & Quality',
          subtitle: 'Certified components direct from Japanese and German manufacturers.',
          image: '/uploads/products/banner2.jpg',
          link: '/shop'
        }
      ];
    case 'testimonials':
      return [
        {
          name: 'Amara de Silva',
          role: 'Toyota Aqua Owner',
          comment: 'Found the exact Japanese spark plugs for my hybrid. Fast delivery to Gampaha!',
          rating: 5
        },
        {
          name: 'Kusal Perera',
          role: 'Wagon R Owner',
          comment: 'Chassis verification tool is amazing. Guaranteed compatibility. No more wrong parts.',
          rating: 5
        }
      ];
    case 'faqs':
      return [
        {
          question: 'How do I know a part fits my vehicle?',
          answer: 'Use our vehicle selector tool on the homepage, or submit a custom Part Request with your Chassis Number. We guarantee compatibility for checked items.'
        },
        {
          question: 'What is your delivery coverage in Sri Lanka?',
          answer: 'We provide island-wide delivery. Rates vary by district: Rs. 350 for Colombo/Gampaha/Kalutara and Rs. 500 for other outstation areas.'
        }
      ];
    case 'blogs':
      return [
        {
          title: 'When Should You Replace Your Air Filters?',
          summary: 'Learn the primary signs of clogged engine and cabin air filters in Sri Lankan driving conditions.',
          image: '/uploads/products/blog1.jpg',
          date: '2026-06-15'
        },
        {
          title: 'Genuine vs Aftermarket Components',
          summary: 'Why buying genuine parts saves you money in repair bills and maintains vehicle resale value.',
          image: '/uploads/products/blog2.jpg',
          date: '2026-06-01'
        }
      ];
    default:
      return {};
  }
};
