const axios = require("axios");
 
const API_KEY = process.env.OPENWEATHER_API_KEY;
 
exports.getWeather = async (city) => {
    try {
        const url = `https://api.openweathermap.org/data/2.5/forecast`;
 
        const response = await axios.get(url, {
            params: {
                q: city,
                appid: API_KEY,
                units: "metric",
                cnt: 5
            }
        });
 
        const forecasts = response.data.list.map(item => ({
            time: item.dt_txt,
            temp: item.main.temp,
            feels_like: item.main.feels_like,
            condition: item.weather[0].main,
            description: item.weather[0].description,
            humidity: item.main.humidity
        }));
 
        return {
            city: response.data.city.name,
            country: response.data.city.country,
            forecasts
        };
 
    } catch (error) {
        console.error("Weather API error:", error.message);
        return null;
    }
}