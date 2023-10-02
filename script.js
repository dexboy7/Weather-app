const apiKey = 'a467b7ddb491523bbd979eb9f5acd732';

const link =
    `https://api.openweathermap.org/data/2.5/forecast?appid=${apiKey}&units=metric&q=`


const root = document.getElementById("root");
const popup = document.getElementById("popup");
const textInput = document.getElementById("text-input");
const form = document.getElementById("form");
const history = document.getElementById("query-history");
const days = document.getElementById("days");

let store = {
    city: "Minsk",
    temperature: 0,
    observationTime: 0,
    description: "",
    queryHistory: JSON.parse(localStorage.getItem('queryHistory')) || [],
    properties: {
        cloudcover: {},
        humidity: {},
        windSpeed: {},
        pressure: {},
        uvIndex: {},
        visibility: {},
    },
    forecast: []
};

const fetchData = async () => {
    try {
        const query = localStorage.getItem("query") || store.city;
        const result = await fetch(`${link}${query}`);
        const data = await result.json();

        const {
            clouds: {all: cloudcover},
            dt: observationTime,
            visibility,
            wind: {speed: windSpeed},
            weather: [description],
            main: {
                temp: temperature,
                humidity,
                pressure,
            },
        } = data.list[0];
        const {name, sunrise, sunset} = data.city

        const forecastByDay = {};

        for (let item of data.list) {
            const date = (new Date(item.dt * 1000)).getDate();
            forecastByDay[date] = [...(forecastByDay[date] || []), item];
        }

        delete forecastByDay[(new Date(data.list[0].dt * 1000)).getDate()];

        const forecast = [];

        for (let key in forecastByDay) {
            let min = Number.MAX_VALUE;
            let max = Number.MIN_VALUE;
            for (let item of forecastByDay[key]) {
                const temp = item.main.temp;

                if (temp > max) {
                    max = temp;
                }

                if (temp < min) {
                    min = temp;
                }
            }

            forecast.push({
                min,
                max,
                date: new Date(forecastByDay[key][0].dt * 1000),
                icon: forecastByDay[key][0].weather[0].icon,
            });
        }

        store = {
            ...store,
            isDay: observationTime > sunrise && observationTime < sunset,
            city: name,
            temperature,
            observationTime,
            icon: description.icon,
            description: description.description,
            forecast,
            properties: {
                cloudcover: {
                    title: "cloudcover",
                    value: `${cloudcover}%`,
                    icon: "cloud.png",
                },
                humidity: {
                    title: "humidity",
                    value: `${humidity}%`,
                    icon: "humidity.png",
                },
                windSpeed: {
                    title: "wind speed",
                    value: `${windSpeed} m/sec`,
                    icon: "wind.png",
                },
                pressure: {
                    title: "pressure",
                    value: `${pressure} mBar`,
                    icon: "gauge.png",
                },
                visibility: {
                    title: "visibility",
                    value: `${visibility} Metres`,
                    icon: "visibility.png",
                },
            },
        };

        renderComponent();
    } catch (err) {
        console.log(err);
    }
};

const getImage = (icon) => {
    return `https://openweathermap.org/img/wn/${icon}@2x.png`
};

const renderProperty = (properties) => {
    return Object.values(properties)
        .map(({title, value, icon}) => {
            return `<div class="property">
            <div class="property-icon">
              <img src="./img/icons/${icon}" alt="">
            </div>
            <div class="property-info">
              <div class="property-info__value">${value}</div>
              <div class="property-info__description">${title}</div>
            </div>
          </div>`;
        })
        .join("");
};

const markup = () => {
    const {city, description, icon, observationTime, temperature, isDay, properties} =
        store;
    const containerClass = isDay ? "is-day" : "";

    return `<div class="container ${containerClass}">
            <div class="top">
              <div class="city">
                <div class="city-subtitle">Weather Today in</div>
                  <div class="city-title" id="city">
                  <span>${city}</span>
                </div>
              </div>
              <div class="city-info">
                <div class="top-left">
                <img class="icon" src="${getImage(icon)}" alt="" />
                <div class="description">${description}</div>
              </div>
            
              <div class="top-right">
                <div class="city-info__subtitle">as of ${new Intl.DateTimeFormat('en-GB', {timeStyle: 'short'}).format(observationTime)}</div>
                <div class="city-info__title">${Math.round(temperature)}°</div>
              </div>
            </div>
          </div>
        <div id="properties">${renderProperty(properties)}</div>
      </div>`;
};

const togglePopupClass = () => {
    popup.classList.toggle("active");
};

const renderComponent = () => {
    root.innerHTML = markup();
    const dateFormat = new Intl.DateTimeFormat('en-GB', {weekday: 'short'})
    days.innerHTML = Object.values(store.forecast)
        .map((forecast) =>
            `
<div class="element" id="element">${dateFormat.format(forecast.date)} ${forecast.max}</br>${forecast.min}</div>
<img class="icon" src="${getImage(forecast.icon)}" alt=""/>
`
        );

    const city = document.getElementById("city");
    city.addEventListener("click", togglePopupClass);
};

const renderHistory = () => {
    history.innerHTML = Object.values(store.queryHistory)
        .map((query) => {
            return `<div class="query-history-item">
        <span onclick="handleQueryHistoryClick('${query}')">${query}</span>
        <button onclick="handleDelete('${query}')">X</button>
          </div>`;
        })
        .join("");
}
const handleInput = (e) => {
    store = {
        ...store,
        city: e.target.value,
    };
};

const handleDelete = (query) => {
    store = {
        ...store,
        queryHistory: store.queryHistory.filter((element) => element != query)
    }
    renderHistory();
    localStorage.setItem("queryHistory", JSON.stringify(store.queryHistory));
}

const handleQueryHistoryClick = (query) => {
    store = {
        ...store,
        city: query,
    }

    handleQuery(query);
}

const handleSubmit = (e) => {
    e.preventDefault();
    const value = store.city;

    if (!value) return null;

    handleQuery(value);
};

const handleQuery = (query) => {

    localStorage.setItem("query", query);
    store = {
        ...store,
        queryHistory: [...new Set([query, ...store.queryHistory])].slice(0, 10),
    }
    localStorage.setItem("queryHistory", JSON.stringify(store.queryHistory));

    renderHistory();
    fetchData();
    togglePopupClass();
};

form.addEventListener("submit", handleSubmit);
textInput.addEventListener("input", handleInput);

renderHistory();
fetchData();

