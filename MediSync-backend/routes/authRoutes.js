const express=require('express');
const router=express.Router();
const authController=require('../controllers/authController');
const authMiddleware=require('../middleware/authMiddleware');

router.post('/register',authController.signUp);
router.post('/login',authController.login);
router.post('/refresh-token',authController.refresh);
router.post('/logout',authController.logout);
router.get('/me', authMiddleware, authController.getCurrentUser);

router.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'You have access', user: req.user });
});


module.exports=router;
