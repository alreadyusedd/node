const express = require('express');
const bodyParser = require('body-parser');
const authenticate = require('../authenticate');
const cors = require('./cors');
const Favorites = require('../models/favorite');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter
  .route('/')
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorites.find({})
      .populate('user')
      .populate('dishes')
      .then(
        (favorites) => {
          let error = new Error();
          error.status = 404;

          if (!favorites) {
            error.message = 'There are no favorites';
            return next(error);
          }

          const userFavorites = favorites.find(
            (fav) => fav.user._id.toString() === req.user.id.toString()
          );

          if (!userFavorites) {
            error.message = 'You have no favorites!';
            return next(error);
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(userFavorites);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.find({})
      .populate('user')
      .populate('dishes')
      .then((favorites) => {
        let userFavorites = favorites.find(
          (fav) => fav.user._id.toString() === req.user.id.toString()
        );

        if (!userFavorites) {
          userFavorites = new Favorites({ user: req.user.id });
        }

        for (const bodyDish of req.body) {
          const existingDish = userFavorites.dishes.find(
            (favoriteDish) =>
              favoriteDish._id.toString() === bodyDish._id.toString()
          );

          if (!existingDish) {
            userFavorites.dishes.push(bodyDish._id);
          }
        }

        userFavorites
          .save()
          .then(
            (savedFavorites) => {
              res.statusCode = 201;
              res.setHeader('Content-Type', 'application/json');
              res.json(savedFavorites);
              console.log('Favorites Created');
            },
            (err) => next(err)
          )
          .catch((err) => next(err));
      })
      .catch((err) => next(err));
  })

  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation is not supported on /favorites');
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.find({})
      .populate('user')
      .populate('dishes')
      .then(
        (favorites) => {
          const userFavorites = favorites.find(
            (fav) => fav.user._id.toString() === req.user.id.toString()
          );

          if (!userFavorites) {
            var err = new Error('You do not have any favourites');
            err.status = 404;
            return next(err);
          }

          userFavorites.remove().then(
            (result) => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json(result);
            },
            (err) => next(err)
          );
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  });

favoriteRouter
  .route('/:dishId')
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 405;
    res.end('GET operation is not supported on /favourites/:dishId');
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.find({})
      .populate('user')
      .populate('dishes')
      .then((favorites) => {
        let userFavorites = favorites.find(
          (fav) => fav.user._id.toString() === req.user.id.toString()
        );

        if (!userFavorites) {
          userFavorites = new Favorites({ user: req.user.id });
        } else {
          const existingFavorite = userFavorites.dishes.find((dish) => {
            if (dish._id)
              return dish._id.toString() === req.params.dishId.toString();
          });

          if (!existingFavorite) {
            userFavorites.dishes.push(req.params.dishId);
          }
        }

        userFavorites
          .save()
          .then(
            (userFavs) => {
              res.statusCode = 201;
              res.setHeader('Content-Type', 'application/json');
              res.json(userFavs);
              console.log('Favorites Added');
            },
            (err) => next(err)
          )
          .catch((err) => next(err));
      })
      .catch((err) => next(err));
  })

  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 405;
    res.end('PUT operation is not supported on /favourites/:dishId');
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.find({})
      .populate('user')
      .populate('dishes')
      .then((favorites) => {
        let userFavorites = favorites.find(
          (fav) => fav.user._id.toString() === req.user.id.toString()
        );

        if (!userFavorites) {
          const err = new Error(
            'You do not have any favorites. First create them.'
          );
          err.status = 404;
          return next(err);
        }

        const indexToRemove = userFavorites.dishes.findIndex((dish) => {
          if (dish._id) {
            return dish._id.toString() === req.params.dishId.toString();
          }
        });

        if (indexToRemove !== -1) {
          userFavorites.dishes.splice(indexToRemove, 1);
        }

        userFavorites
          .save()
          .then(
            (userFavs) => {
              res.statusCode = 201;
              res.setHeader('Content-Type', 'application/json');
              res.json(userFavs);
              console.log('Favorites Added');
            },
            (err) => next(err)
          )
          .catch((err) => next(err));
      })
      .catch((err) => next(err));
  });

module.exports = favoriteRouter;
