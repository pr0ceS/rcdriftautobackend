const bcrypt = require("bcrypt");
const { User } = require("../models/user");
const { auth, isUser, isAdmin } = require("../middleware/auth");
const moment = require("moment");

const router = require("express").Router();

//GET ALL USERS

router.get("/", isAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ _id: -1 });
    res.status(200).send(users);
  } catch (err) {
    res.status(500).send(err);
  }
});

//DELETE

router.delete("/:id", isAdmin, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    res.status(200).send(deletedUser);
  } catch (error) {
    res.status(500).send(error);
  }
});

// GET USER
router.get("/find/:id", isUser, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    res.status(200).send({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      isCompany: user.isCompany,
			company: user.company,
      straat: user.straat,
      huisnummer: user.huisnummer,
      postcode: user.postcode,
      stad: user.stad,
      UST: user.UST,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

// UPDATE USER
router.put("/:id", isUser, async (req, res) => {
  try {
    const {name, email, password, straat, isCompany, company, huisnummer, postcode, stad, UST, phoneNumber} = req.body;
    const user = await User.findById(req.params.id);

    if (!(user.email === email)) {
      const emailInUse = await User.findOne({ email: email });
      if (emailInUse)
        return res.status(400).send("Deze e-mail is al bezet");
    }

    if (password && user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user.password = hashedPassword;
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        name: name,
        email: email,
        password: user.password,
        straat: straat,
        huisnummer: huisnummer,
				isCompany: isCompany,
				company: company,
        postcode: postcode,
        stad: stad,
        UST: UST,
        phoneNumber: phoneNumber,
      },
      { new: true }
    );

    res.status(200).send({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } catch (error) {
    res.status(500).send(error);
    console.log(error);
  }
});

// GET USER STATS

router.get("/stats", isAdmin, async (req, res) => {
  const previousMonth = moment()
    .month(moment().month() - 2)
    .format("YYYY-MM-DD HH:mm:ss");

  try {
    const users = await User.aggregate([
      { $match: { createdAt: { $gte: new Date(previousMonth) } } },
      {
        $project: {
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: 1 },
        },
      },
    ]);
    res.status(200).send(users);
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = router;
