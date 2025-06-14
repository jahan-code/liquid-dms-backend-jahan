import ApiError from "../utils/ApiError.js";
import errorConstants from "../utils/errors.js";
import { validationSchemas } from "../validations/index.js";
import { pathToRegexp } from "path-to-regexp";

const requestValidator = (req, res, next) => {
  try {
    const { method, originalUrl, body } = req;

    // Extract route path without query parameters
    const fullURL = originalUrl.split("?")[0];

    // Find a matching route using path-to-regexp v8.x syntax
    const matchedRoute = Object.keys(validationSchemas).find((route) => {
      try {
        const { regexp } = pathToRegexp(route);
        return regexp.test(fullURL);
      } catch (err) {
        return false;
      }
    });

    // If no matching route found, skip validation
    if (!matchedRoute) {
      return next(new ApiError(errorConstants.GENERAL.VALIDATION_ERROR, 400));
    }

    const routeSchemas = validationSchemas[matchedRoute];
    if (!routeSchemas) {
      return next(new ApiError(errorConstants.GENERAL.VALIDATION_ERROR, 400));
    }
    const schema = routeSchemas[method];

    // For joi validation null means no schema needed
    if (schema === null) {
      return next();
    }

    // If no schema for this method, skip validation
    if (!schema) {
      return next();
    }

    // Skip validation for file uploads (multipart/form-data)
    if (req.is("multipart/form-data")) {
      return next();
    }

    const { error } = schema.validate(body, { abortEarly: false });

    if (error) {
      error.details.forEach((detail) => {
        console.log(`  - ${detail.path.join(".")}: ${detail.message}`);
      });
      return next(new ApiError(error.details[0].message, 400));
    }

    next();
  } catch (err) {
    next(new ApiError("Validation Middleware Error", 500));
  }
};

export default requestValidator;
