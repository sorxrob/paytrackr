const config = {
  apiUrl: process.env.NODE_ENV === "development"
    ? "http://localhost:3030"
    : "https://paytrackr-api.now.sh",
  decimalPlaces: 9,
};

export default config;
