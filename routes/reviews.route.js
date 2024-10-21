const express = require('express')
const reviewRouter = express.Router();

const isAuth = require('../middleware/jwt_auth');
const { getReviews, postReview, todoReview, getTodoById, postUserReview, postReviews } = require('../controller/reviews.controller');

// employee====>
reviewRouter.post("/create",isAuth , postReviews);
reviewRouter.get("/todo" , isAuth ,  todoReview);
reviewRouter.get("/:type",isAuth , getReviews);
// reviewRouter.get('/getTodo/:id' , isAuth , getTodoById)
// reviewRouter.post('/user-review' , isAuth , postUserReview)

module.exports = reviewRouter