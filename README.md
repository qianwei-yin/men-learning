# Backend App Built By MongoDB, Express and Node.js

### About

Imagine you are going to build a Tour website (like Expedia), then many of your functionalities can be built by this powerful backend.
<br>

### Most Proud of

##### Feature-rich API w/ documentation

✅ Includes endpoints related to tours, users, reviews, authentication and authorization.
✅ Many customized features which helps business analyzation.
✅ More than 30 endpoints and usage are listed in a [detailed documentation](https://documenter.getpostman.com/view/25223323/2s935mrPtb#bd5e3ba3-952b-4117-8797-868456768c04).
<br>

##### SECURE Authentication/Authorization

✅ Compromised Database

-   Strongly encrypt passwords with salt and hash (using bcrypt)
-   Strongly encrypt password reset tokens (SHA 256)

✅ Avoid brute force attacks

-   Use bcrypt (to make login requests slow)
-   Implement rate limiting (express-rate-limit)

✅ Avoid cross-site scripting (XSS) attacks

-   Store JWT in HTTPOnly cookies
-   Sanitize user input data
-   Set special HTTP headers (using helmet package)

✅ Avoid denial-of-service (DOS) attacks

-   Implement rate limiting (express-rate-limit)
-   Limit body payload (in body-parser)
-   Avoid evil regular expressions

✅ Avoid NoSQL query injection

-   Use mongoose for MongoDB (because of SchemaTypes)
-   Sanitize user input data

✅ Others

-   Use HTTPS
-   Create random password reset tokens with expiry dates
-   Deny access to JWT after password change
-   Not send error details to clients
-   Prevent parameter pollution causing Uncaught Exceptions
    <br>

### Possible Improvements

📌 Implement maximum login attempts
📌 Prevent Cross-Site Request Forgery (using csurf package)
📌 Require re-authentication before a high-value action
📌 Implement a blacklist of untrusted JWT
📌 Confirm user email address after first creating account
📌 Keep user logged in with refresh tokens
📌 Implement two-factor authentication
📌 Build a front-end application
