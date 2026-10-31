# Wildlife donation backend

This small Express server serves the website from `../wildlife` and saves donation form submissions in `donations.json`. It records donation details only; it does not process payments.

## Run locally

```sh
npm install
npm start
```

Open <http://localhost:3000>. Set the `PORT` environment variable to use a different port.

## API

`POST /api/donations` accepts JSON with `amount` (a positive number), `name` (up to 100 characters), and `email` (a valid email address). A successful request returns HTTP `201` with the saved donation. Invalid data returns HTTP `400` with an `error` message.
