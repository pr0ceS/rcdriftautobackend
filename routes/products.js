const { Product } = require("../models/Product");
const { auth, isUser, isAdmin } = require("../middleware/auth");
const cloudinary = require("../utils/cloudinary");
const { Review } = require("../models/Review");
const { response } = require("express");
const slugify = require('slugify');

const router = require("express").Router();


// Products
router.get("/random", async (req, res) => {
	try {
		const products = await Product.find();

		const array = [];
		for (let i = 0; i < 8; i++) {
			let random_int = Math.round(Math.random()*(products.length -1));
			array.push(products[random_int]);
			products.splice(random_int, 1);
		}

		res.json(array)

	} catch (error) {
		
	}
})

// Bestseller Products
router.get('/bestseller', async (req, res) => {
	try {
		const bestsellerProducts = await Product.find({ranking: "bestseller"})

		res.json(bestsellerProducts);
	} catch (error) {
		res.json(error);
	}
})

// Neueu Products
router.get('/new', async (req, res) => {
	try {
		const newProducts = await Product.find({ranking: "neue"})

		res.json(newProducts);
	} catch (error) {
		res.json(error);
	}
})

// Accessoires
router.get('/accessoires', async (req, res) => {
	try {
		const accessoires = await Product.find({category: "accessoires"})

		res.json(accessoires);
	} catch (error) {
		res.json(error);
	}
})


//CREATE

router.post("/", isAdmin, async (req, res) => {
  const { name, desc, price, image, sale, tax, stock, deliveryTime, color, ranking, soldOut } = req.body;

  try {
    if (image) {
			let newArray = [];

			async function uploadImages() {
				for (let img of image) {
					let response = await cloudinary.uploader.upload(img, {upload_preset: "ml_default"})
					newArray.push(response.secure_url);
				}
				if(newArray) {
					const product = new Product({
						name,
						desc,
						price,
						image: newArray,
						url: await slugify(name).toLowerCase(),
						sale,
						tax,
						stock,
						deliveryTime,
						color,
						ranking,
						soldOut
					});
					
					const savedProduct = await product.save();
					res.status(200).send(savedProduct);
				}
			}

			uploadImages();
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//DELETE

router.delete("/:id", isAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).send("Product niet gevonden...");
		else {
			const deletedProduct = await Product.findByIdAndDelete(req.params.id);

			res.status(200).send(deletedProduct);
		}
  } catch (error) {
    res.status(500).send(error);
  }
});

// EDIT PRODUCT

router.put("/:id", isAdmin, async (req, res) => {
  if (req.body.productImg) {
    const destroyResponse = await cloudinary.uploader.destroy(
      req.body.product.image.public_id
    );

    if (destroyResponse) {
      const uploadedResponse = await cloudinary.uploader.upload(
        req.body.productImg,
        {
          upload_preset: "ml_default",
        }
      );

      if (uploadedResponse) {
        const updatedProduct = await Product.findByIdAndUpdate(
          req.params.id,
          {
            $set: {
              ...req.body.product,
              image: uploadedResponse,
            },
          },
          { new: true }
        );

        res.status(200).send(updatedProduct);
      }
    }
  } else {
    try {
      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
          $set: req.body.product,
        },
        { new: true }
      );
      res.status(200).send(updatedProduct);
    } catch (err) {
      res.status(500).send(err);
    }
  }
});

//GET ALL PRODUCTS

router.get("/", async (req, res) => {
  const qbrand = req.query.brand;
  try {
    let products;

    if (qbrand) {
      products = await Product.find({
        brand: qbrand,
      }).sort({ _id: -1 });
    } else {
      products = await Product.find().sort({ _id: -1 });
    }

    res.status(200).send(products);
  } catch (error) {
    res.status(500).send(error);
  }
});

//GET PRODUCT

router.get("/find/:id", async (req, res) => {
  try {

    const product = await Product.findOne({url: req.params.id});
    res.status(200).send(product);
  } catch (error) {
    res.status(500).send(error);
  }
});


// CREATE REVIEW
router.post('/review/:id', async (req, res) => {
  const {name, email, stars, title, message} = req.body;

  try {
    const product = await Product.findOne({url: req.params.id});

    if (!product) return res.status(404).send("Product niet gevonden...");

    else {
      const review = new Review({
        productUrl: req.params.id,
        name: name,
        email: email,
        stars: stars,
        title: title,
        message: message,
      });

      const savedProduct = await review.save();

      const product = await Product.findOne({ url: req.params.id })

      const newRatingCount = await product.ratingCount + 1;
      console.log(product.averageRating)  
      console.log(product.ratingCount)
      console.log(savedProduct.stars)
      const newAverageRating = await (product.averageRating * product.ratingCount + savedProduct.stars) / await newRatingCount;

      product.ratingCount = newRatingCount;
      product.averageRating = newAverageRating;

      await product.save();
      res.status(200).send(savedProduct);
    }

  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }

});

// GET REVIEWS FOR PRODUCT
router.get('/review/:id', async (req, res) => {
  try {
    const reviews = await Review.find({productUrl: req.params.id});

    res.send(reviews);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
})

router.get('/review/:id/average', async (req, res) => {
  try {
    const reviews = await Review.find({productUrl: req.params.id});

    if(reviews[0]) {
      res.status(200).json({average: reviews.reduce((n, {stars}) => n + stars / reviews.length, 0), count: reviews.length})
    } else {
      res.json({average: 0, count: 0})
    }

  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
})

// DELETE REVIEW
router.delete("/review/:id", isAdmin, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      res.status(404).send("Review niet gevonden...") 
    } else {
      const deletedReview = await Review.findByIdAndDelete(req.params.id);
      res.status(200).send(deletedReview);
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

// GET ALL REVIEWS
router.get('/reviews', isAdmin, async (req, res) => {
  try {
    const reviews = await Review.find({});
    res.status(200).send(reviews);
  } catch (error) {
    
  }
})

// GET REVIEW COUNT
router.get('/reviews/count', isAdmin, async (req, res) => {
  try {
    const reviews = await Review.count({}, function(err, count) {
      res.json(count);
    })
  } catch (error) {
  }
})


module.exports = router;
