import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Trophy, TrendingUp, TrendingDown, Award, Zap, Save } from 'lucide-react';
import Head from 'next/head';

// NYC/Nassau County coordinates
const NYC_COORDS = { lat: 40.7128, lon: -74.0060 };

// Trinidad distances - show progress as percentage (in feet)
const UNIQUE_DISTANCES = [
  // Port of Spain connections
  { name: 'Port of Spain to San Fernando', distance: 142560 }, // 27 miles
  { name: 'Port of Spain to Arima', distance: 21120 },
  { name: 'Port of Spain to Chaguanas', distance: 26400 },
  { name: 'Port of Spain to Point Fortin', distance: 84480 },
  { name: 'Port of Spain to Maracas Beach', distance: 26400 },
  { name: 'Port of Spain to Toco', distance: 73920 },
  { name: 'Port of Spain to Siparia', distance: 105600 },
  
  // San Fernando connections
  { name: 'San Fernando to Point Fortin', distance: 39600 },
  { name: 'San Fernando to Siparia', distance: 39600 },
  { name: 'San Fernando to Princes Town', distance: 68640 },
  { name: 'San Fernando to Mayaro Beach', distance: 131760 },
  { name: 'San Fernando to Moruga', distance: 99000 },
  { name: 'San Fernando to Chaguanas', distance: 58080 },
  
  // Arima connections
  { name: 'Arima to Blanchisseuse', distance: 47520 },
  { name: 'Arima to Port of Spain', distance: 21120 },
  { name: 'Arima to Toco', distance: 50160 },
  { name: 'Arima to Sangre Grande', distance: 42240 },
  
  // Other Northern connections
  { name: 'Port of Spain to Maraval', distance: 13200 },
  { name: 'Chaguanas to Sangre Grande', distance: 50160 },
  { name: 'Arouca to Tunapuna', distance: 9240 },
  
  // Southern connections
  { name: 'Point Fortin to Fullerton', distance: 26400 },
  { name: 'Siparia to Moruga', distance: 63360 },
  { name: 'Princes Town to Rio Claro', distance: 42240 },
  { name: 'Rio Claro to Guayaguayare', distance: 39600 },
  
  // Cross-island routes
  { name: 'Arima to San Fernando', distance: 99000 },
  { name: 'Chaguanas to Point Fortin', distance: 63360 },
  { name: 'Port of Spain to Moruga', distance: 126720 },
  
  // Trinidad to Tobago & Guyana
  { name: 'Trinidad to Scarborough (Tobago)', distance: 163680 },
  { name: 'Port of Spain to Georgetown', distance: 316800 },
  { name: 'San Fernando to Georgetown', distance: 355200 },
  
  // Guyana Capital Towns
  { name: 'Georgetown to Linden', distance: 295680 }, // 56 miles
  { name: 'Georgetown to New Amsterdam', distance: 306240 }, // 58 miles
  { name: 'Georgetown to Corriverton', distance: 480480 }, // 91 miles
  { name: 'Georgetown to Bartica', distance: 221760 }, // 42 miles
  { name: 'Georgetown to Mahdia', distance: 660000 }, // 125 miles
  { name: 'Georgetown to Anna Regina', distance: 205920 }, // 39 miles
  { name: 'Georgetown to Lethem', distance: 1383360 }, // 262 miles
  { name: 'Linden to Mahdia', distance: 401280 }, // 76 miles
  { name: 'Linden to Corriverton', distance: 422400 }, // 80 miles
  { name: 'Linden to Anna Regina', distance: 459360 }, // 87 miles
  { name: 'Linden to Lethem', distance: 1098240 }, // 208 miles
  { name: 'New Amsterdam to Corriverton', distance: 174240 }, // 33 miles
  { name: 'New Amsterdam to Mahdia', distance: 686400 }, // 130 miles
  { name: 'New Amsterdam to Lethem', distance: 1335840 }, // 253 miles
  { name: 'Corriverton to Mahdia', distance: 765600 }, // 145 miles
  { name: 'Corriverton to Anna Regina', distance: 681120 }, // 129 miles
  { name: 'Bartica to New Amsterdam', distance: 649920 }, // 123 miles (approximate)
  
  // Reference standards
  { name: 'Full Marathon', distance: 138336 },
  { name: 'Half Marathon', distance: 69168 },
  { name: '10K Race', distance: 32808 },
  { name: '5K Race', distance: 16404 },
  { name: 'One Mile', distance: 5280 },
];

function getWeatherEmoji(code, isDay) {
  if (code === 0) return '☀️';
  if (code === 1 || code === 2) return '⛅';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if (code === 51 || code === 53 || code === 55) return '🌧️';
  if (code === 61 || code === 63 || code === 65) return '🌧️';
  if (code === 71 || code === 73 || code === 75 || code === 77 || code === 80 || code === 81 || code === 82) return '❄️';
  if (code === 85 || code === 86) return '❄️';
  if (code === 95 || code === 96 || code === 99) return '⛈️';
  return '🌤️';
}

function getWeatherCondition(code) {
  if (code === 0) return 'Clear Sky';
  if (code === 1) return 'Mainly Clear';
  if (code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Foggy';
  if (code === 51 || code === 53 || code === 55) return 'Drizzle';
  if (code === 61 || code === 63 || code === 65) return 'Rainy';
  if (code === 71 || code === 73 || code === 75 || code === 77) return 'Snow';
  if (code === 80 || code === 81 || code === 82) return 'Rain Showers';
  if (code === 85 || code === 86) return 'Snow Showers';
  if (code === 95 || code === 96 || code === 99) return 'Thunderstorm';
  return 'Unknown';
}

async function fetchCurrentWeather() {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${NYC_COORDS.lat}&longitude=${NYC_COORDS.lon}&current=temperature_2m,weather_code,relative_humidity_2m,is_day&temperature_unit=fahrenheit&timezone=America/New_York`
    );
    
    if (!response.ok) throw new Error('Weather fetch failed');
    
    const weatherData = await response.json();
    const current = weatherData.current;
    
    return {
      temp: Math.round(current.temperature_2m),
      condition: getWeatherCondition(current.weather_code),
      emoji: getWeatherEmoji(current.weather_code, current.is_day),
      humidity: current.relative_humidity_2m,
      location: 'NYC/Nassau County'
    };
  } catch (err) {
    console.error('Weather fetch error:', err);
    return null;
  }
}

function getUniqueDistance(playerIndex, steps) {
  const feetWalked = steps * 2.5;
  
  // Find the first distance under 100%
  let distanceIndex = playerIndex % UNIQUE_DISTANCES.length;
  let distance = UNIQUE_DISTANCES[distanceIndex];
  let percentage = ((feetWalked / distance.distance) * 100);
  
  // If over 100%, cycle through distances until we find one under 100%
  let offset = 0;
  while (percentage > 100 && offset < UNIQUE_DISTANCES.length) {
    offset++;
    distanceIndex = (playerIndex + offset) % UNIQUE_DISTANCES.length;
    distance = UNIQUE_DISTANCES[distanceIndex];
    percentage = ((feetWalked / distance.distance) * 100);
  }
  
  const distanceMiles = (distance.distance / 5280).toFixed(1);
  return `${percentage.toFixed(1)}% of the way to ${distance.name} (${distanceMiles} mi)`;
}

export default function StompersApp() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [activeTab, setActiveTab] = useState('today');
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showCompletedDistances, setShowCompletedDistances] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/stompers_data.json');
        if (!response.ok) throw new Error('Failed to load data');
        const jsonData = await response.json();
        setData(jsonData);
        const initMonth = jsonData.currentMonth || 'october';
        setSelectedMonth(initMonth);
        const monthData = jsonData.months[initMonth];
        setSelectedDay(monthData.challenge.currentDay);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  const getMonthData = () => {
    if (!data || !selectedMonth) return null;
    return data.months[selectedMonth];
  };
  
  const getDailySteps = (day, playerName) => {
    const monthData = getMonthData();
    if (!monthData) return 0;
    const dailyData = monthData.dailyData[day];
    if (!dailyData) return 0;
    
    // October: use competition branch
    if (dailyData.competition !== undefined) {
      return dailyData.competition[playerName] || 0;
    }
    
    // September: flat structure
    return dailyData[playerName] || 0;
  };
  
  const getDailyStepsForAllPlayers = (day) => {
    const monthData = getMonthData();
    if (!monthData) return {};
    const dailyData = monthData.dailyData[day];
    if (!dailyData) return {};
    
    const allPlayers = getPlayers();
    const result = {};
    
    // October: extract from competition branch
    if (dailyData.competition !== undefined) {
      allPlayers.forEach(player => {
        result[player] = dailyData.competition[player] || 0;
      });
    } else {
      // September: flat structure
      allPlayers.forEach(player => {
        result[player] = dailyData[player] || 0;
      });
    }
    
    return result;
  };
  
  const getPlayers = () => {
    const monthData = getMonthData();
    if (!monthData) return [];
    
    // October: show only paying competition players
    if (selectedMonth === 'october') {
      return monthData.challenge.payingPlayers || [];
    }
    
    // September: show all players
    return monthData.players || [];
  };

  useEffect(() => {
    if (data) {
      const loadWeather = async () => {
        setWeatherLoading(true);
        const weather = await fetchCurrentWeather();
        if (weather) {
          setCurrentWeather(weather);
        }
        setWeatherLoading(false);
      };
      
      loadWeather();
      const interval = setInterval(loadWeather, 15 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [data]);

  const handleRefreshWeather = async () => {
    setWeatherLoading(true);
    const weather = await fetchCurrentWeather();
    if (weather) {
      setCurrentWeather(weather);
    }
    setWeatherLoading(false);
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>September Stompers</title>
        </Head>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-white text-2xl">Loading stompers...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>September Stompers - Error</title>
        </Head>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-red-400 text-xl">Error: {error}</div>
        </div>
      </>
    );
  }

  if (!data || !selectedMonth) return null;

  const monthData = getMonthData();
  const players = getPlayers();

  // Calculate daily payouts ($6.45 per day for winner)
  const DAILY_PAYOUT = 6.45;
  
  const calculatePayouts = () => {
    const payouts = {};
    players.forEach(player => {
      payouts[player] = 0;
    });

    for (let day = 1; day <= monthData.challenge.currentDay; day++) {
      // Find daily winner
      let dayWinner = null;
      let maxSteps = 0;
      
      players.forEach(player => {
        const steps = getDailySteps(day, player);
        if (steps > maxSteps) {
          maxSteps = steps;
          dayWinner = player;
        }
      });
      
      if (dayWinner && maxSteps > 0) {
        payouts[dayWinner] += DAILY_PAYOUT;
      }
    }

    return payouts;
  };

  // Get cumulative totals
  const calculateCumulatives = () => {
    const cumulatives = {};
    players.forEach(player => {
      cumulatives[player] = 0;
    });

    for (let day = 1; day <= monthData.challenge.currentDay; day++) {
      players.forEach(player => {
        cumulatives[player] += getDailySteps(day, player);
      });
    }

    return cumulatives;
  };

  const cumulatives = calculateCumulatives();
  const payouts = calculatePayouts();

  // Sort players by cumulative total
  const rankings = players
    .map((player) => ({
      name: player,
      total: cumulatives[player],
      dailyPayouts: payouts[player]
    }))
    .sort((a, b) => b.total - a.total)
    .map((player, idx) => ({
      rank: idx + 1,
      name: player.name,
      total: player.total,
      dailyPayouts: player.dailyPayouts,
      prize: idx === 0 ? monthData.challenge.prizes['1st'] : idx === 1 ? monthData.challenge.prizes['2nd'] : idx === 2 ? monthData.challenge.prizes['3rd'] : 0
    }));

  // Get daily data for selected day
  const dayRankings = players
    .map((player) => ({
      name: player,
      steps: getDailySteps(selectedDay, player),
      cumulative: cumulatives[player]
    }))
    .sort((a, b) => b.steps - a.steps);

  // Prepare cumulative chart data
  const chartData = [];
  for (let day = 1; day <= monthData.challenge.currentDay; day++) {
    const dayData = { day: `Day ${day}` };
    rankings.forEach(player => {
      let cumTotal = 0;
      for (let d = 1; d <= day; d++) {
        cumTotal += getDailySteps(d, player.name);
      }
      dayData[player.name] = cumTotal;
    });
    chartData.push(dayData);
  }

  const colors = ['#FFD700', '#C0C0C0', '#CD7F32', '#FF6B6B', '#4ECDC4', '#45B7D1', '#A78BFA', '#F472B6', '#38BDF8', '#34D399'];

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  return (
    <>
      <Head>
        <title>{monthData.challenge.name} - Live Leaderboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        {/* Header */}
        <div className="border-b border-gray-700 bg-gray-800/50 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
            {/* Month Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => {
                  setSelectedMonth('september');
                  setSelectedDay(data.months.september.challenge.currentDay);
                }}
                className={`px-4 py-2 rounded-lg font-bold transition ${
                  selectedMonth === 'september'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                September
              </button>
              <button
                onClick={() => {
                  setSelectedMonth('october');
                  setSelectedDay(data.months.october.challenge.currentDay);
                }}
                className={`px-4 py-2 rounded-lg font-bold transition ${
                  selectedMonth === 'october'
                    ? 'bg-orange-500 text-black'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                October
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
              <div className="flex-1">
                <h1 className="text-3xl md:text-5xl font-black mb-2 bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                  {monthData.challenge.name.toUpperCase()}
                </h1>
                <p className="text-gray-400 text-sm md:text-lg">
                  Day {monthData.challenge.currentDay}/{monthData.challenge.totalDays} • {players.length} Players • ${monthData.challenge.prizePool}
                </p>
              </div>
              
              {/* Weather Display for Selected Day */}
              {monthData.weather && monthData.weather[selectedDay] && (
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 md:p-6 text-center md:text-right relative group w-full md:w-auto">
                  <div className="text-3xl md:text-4xl mb-2">{monthData.weather[selectedDay].emoji}</div>
                  <div className="text-white font-bold text-sm md:text-base mb-1">Day {selectedDay}</div>
                  <div className="text-white font-bold text-sm md:text-base mb-1">{monthData.weather[selectedDay].condition}</div>
                  <div className="text-xl md:text-2xl text-blue-100 font-bold">{monthData.weather[selectedDay].temp}°F</div>
                  <div className="text-xs md:text-sm text-blue-200">Humidity: {monthData.weather[selectedDay].humidity}%</div>
                </div>
              )}
            </div>
            
            {/* Prize Breakdown */}
            <div className="grid grid-cols-3 gap-2 md:flex md:gap-4 mb-4">
              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-3 md:p-4 flex flex-col md:flex-row items-center gap-2 md:gap-3">
                <Trophy size={20} className="md:block hidden" />
                <Trophy size={16} className="md:hidden" />
                <div>
                  <div className="text-xs md:text-sm opacity-90">1st</div>
                  <div className="text-lg md:text-2xl font-bold">${monthData.challenge.prizes['1st']}</div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg p-3 md:p-4 flex flex-col md:flex-row items-center gap-2 md:gap-3">
                <Trophy size={20} className="md:block hidden" />
                <Trophy size={16} className="md:hidden" />
                <div>
                  <div className="text-xs md:text-sm opacity-90">2nd</div>
                  <div className="text-lg md:text-2xl font-bold">${monthData.challenge.prizes['2nd']}</div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-3 md:p-4 flex flex-col md:flex-row items-center gap-2 md:gap-3">
                <Trophy size={20} className="md:block hidden" />
                <Trophy size={16} className="md:hidden" />
                <div>
                  <div className="text-xs md:text-sm opacity-90">3rd</div>
                  <div className="text-lg md:text-2xl font-bold">${monthData.challenge.prizes['3rd']}</div>
                </div>
              </div>
            </div>

            {/* Calendar Day Selector */}
            <div className="bg-gray-700/30 rounded-lg p-4 md:p-6">
              <div className="mb-4">
                <p className="text-gray-300 font-semibold text-base md:text-lg">Select a Day</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 md:p-4 overflow-x-auto">
                <div className="text-center mb-3 md:mb-4">
                  <h3 className="text-white font-bold text-base md:text-lg">{monthData.challenge.name} 2026</h3>
                  <p className="text-gray-400 text-xs md:text-sm">Current: Day {monthData.challenge.currentDay}</p>
                </div>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 md:gap-2 min-w-max md:min-w-full">
                  {/* Day headers */}
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="text-center text-gray-400 font-bold text-xs md:text-sm w-8 h-8 md:w-10 md:h-10 flex items-center justify-center">
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar days */}
                  {Array.from({ length: 42 }, (_, i) => {
                    // Calculate what day of week the 1st falls on
                    // October 2026: 1st is Thursday (day 4)
                    // September 2026: 1st is Tuesday (day 2)
                    const firstDayOfWeek = selectedMonth === 'october' ? 4 : 2;
                    
                    if (i < firstDayOfWeek) {
                      // Previous month days
                      const prevMonthDays = selectedMonth === 'october' ? 30 : 31;
                      const dayNum = prevMonthDays - (firstDayOfWeek - 1 - i);
                      return (
                        <div key={`prev-${i}`} className="text-center text-gray-600 text-xs md:text-sm w-8 h-8 md:w-10 md:h-10 flex items-center justify-center">
                          {dayNum}
                        </div>
                      );
                    } else if (i < monthData.challenge.totalDays + firstDayOfWeek) {
                      // Challenge days
                      const day = i - firstDayOfWeek + 1;
                      const isAvailable = day <= monthData.challenge.currentDay;
                      const isSelected = selectedDay === day;
                      const isToday = day === monthData.challenge.currentDay;
                      
                      return (
                        <button
                          key={day}
                          onClick={() => isAvailable && setSelectedDay(day)}
                          disabled={!isAvailable}
                          className={`text-center text-xs md:text-sm font-bold w-8 h-8 md:w-10 md:h-10 rounded flex items-center justify-center transition active:scale-95 ${
                            isSelected
                              ? 'bg-yellow-500 text-black border-2 border-yellow-400'
                              : isToday
                              ? 'bg-blue-500 text-white'
                              : isAvailable
                              ? 'bg-gray-700 text-white active:bg-gray-600 cursor-pointer'
                              : 'bg-gray-900 text-gray-600 cursor-not-allowed'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    } else {
                      // Next month days
                      const nextMonthDay = i - monthData.challenge.totalDays - firstDayOfWeek + 1;
                      return (
                        <div key={`next-${i}`} className="text-center text-gray-600 text-xs md:text-sm w-8 h-8 md:w-10 md:h-10 flex items-center justify-center">
                          {nextMonthDay}
                        </div>
                      );
                    }
                  })}
                </div>
                
                {/* Legend */}
                <div className="mt-3 md:mt-4 text-xs md:text-sm text-gray-400 space-y-1 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-0">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 md:w-4 md:h-4 bg-yellow-500 rounded"></div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 md:w-4 md:h-4 bg-blue-500 rounded"></div>
                    <span>Today</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 md:w-4 md:h-4 bg-gray-700 rounded"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 md:w-4 md:h-4 bg-gray-900 rounded"></div>
                    <span>Not yet</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full mx-auto px-4 md:px-6 py-6 md:py-8 max-w-7xl">
          {/* Top 3 Podium */}
          <div className="mb-8 md:mb-12">
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center gap-2">
              <Trophy className="text-yellow-400" size={24} />
              Overall Leaders
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
              {rankings.slice(0, 3).map((player, idx) => (
                <div
                  key={player.name}
                  className={`rounded-lg p-4 md:p-6 border-2 ${
                    idx === 0
                      ? 'bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 border-yellow-500 md:scale-105'
                      : idx === 1
                      ? 'bg-gradient-to-br from-gray-700/40 to-gray-600/20 border-gray-400'
                      : 'bg-gradient-to-br from-orange-900/40 to-orange-800/20 border-orange-500'
                  }`}
                >
                  <div className="text-3xl md:text-4xl mb-2">{getMedalEmoji(idx + 1)}</div>
                  <div className="text-lg md:text-xl font-bold mb-1 break-words">{player.name}</div>
                  <div className="text-2xl md:text-3xl font-black text-yellow-300 mb-2">
                    {player.total.toLocaleString()}
                  </div>
                  <div className="text-xs md:text-sm text-gray-300 mb-2 leading-tight">
                    {getUniqueDistance(rankings.indexOf(player), player.total)}
                  </div>
                  <div className={`text-base md:text-lg font-bold ${
                    idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : 'text-orange-400'
                  }`}>
                    ${player.prize}
                  </div>
                </div>
              ))}
            </div>

            {/* Gaps Between Ranks */}
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-600 rounded-lg p-4 md:p-6 mb-6 md:mb-8">
              <h3 className="text-blue-400 font-bold mb-4 text-sm md:text-base">📊 Step Gaps</h3>
              <div className="space-y-3">
                {rankings.slice(0, 5).map((player, idx) => (
                  <div key={player.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-semibold text-sm md:text-base">
                        {idx + 1}. {player.name}
                      </div>
                      <div className="text-yellow-300 font-bold text-sm md:text-base">
                        {player.total.toLocaleString()}
                      </div>
                    </div>
                    {idx < 4 && rankings[idx + 1] && (
                      <div className="flex items-center gap-2 ml-4">
                        <div className="h-1 flex-1 bg-blue-600 rounded"></div>
                        <div className="text-xs md:text-sm text-blue-300 font-semibold whitespace-nowrap">
                          +{(rankings[idx].total - rankings[idx + 1].total).toLocaleString()} steps
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Tab Navigation */}
          <div className="mb-8 flex gap-2 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('today')}
              className={`px-6 py-3 font-semibold text-sm md:text-base transition ${
                activeTab === 'today'
                  ? 'text-orange-400 border-b-2 border-orange-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              📊 Today's Steps & Drama
            </button>
            <button
              onClick={() => setActiveTab('overall')}
              className={`px-6 py-3 font-semibold text-sm md:text-base transition ${
                activeTab === 'overall'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              🏆 Overall Steps & Records
            </button>
          </div>

          {/* TAB 1: TODAY */}
          {activeTab === 'today' && (
          <div>

          {/* Daily Insights */}
          <div className="mb-8 md:mb-12">
            <h2 className="text-lg md:text-2xl font-bold mb-4 md:mb-6 flex items-center gap-2">
              <Zap className="text-orange-400" size={24} />
              Today's Drama
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Biggest Gainers */}
              <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-600 rounded-lg p-4 md:p-6">
                <h3 className="text-green-400 font-bold mb-4 flex items-center gap-2">
                  🚀 Biggest Gainers (vs Yesterday)
                </h3>
                <div className="space-y-3">
                  {(() => {
                    if (selectedDay === 1) {
                      return <div className="text-gray-400 text-sm">No previous day to compare</div>;
                    }
                    
                    const todaySteps = getDailyStepsForAllPlayers(selectedDay);
                    const yesterdaySteps = getDailyStepsForAllPlayers(selectedDay - 1);
                    
                    const changes = players.map(player => ({
                      name: player,
                      today: todaySteps[player] || 0,
                      yesterday: yesterdaySteps[player] || 0,
                      change: (todaySteps[player] || 0) - (yesterdaySteps[player] || 0)
                    }))
                    .sort((a, b) => b.change - a.change)
                    .slice(0, 3);
                    
                    return changes.map((player) => (
                      <div key={player.name} className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-sm md:text-base">{player.name}</div>
                          <div className="text-xs text-gray-400">{player.yesterday.toLocaleString()} → {player.today.toLocaleString()}</div>
                        </div>
                        <div className="text-green-400 font-bold">+{player.change.toLocaleString()}</div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Biggest Losers */}
              <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 border border-red-600 rounded-lg p-4 md:p-6">
                <h3 className="text-red-400 font-bold mb-4 flex items-center gap-2">
                  📉 Biggest Fallers (vs Yesterday)
                </h3>
                <div className="space-y-3">
                  {(() => {
                    if (selectedDay === 1) {
                      return <div className="text-gray-400 text-sm">No previous day to compare</div>;
                    }
                    
                    const todaySteps = getDailyStepsForAllPlayers(selectedDay);
                    const yesterdaySteps = getDailyStepsForAllPlayers(selectedDay - 1);
                    
                    const changes = players.map(player => ({
                      name: player,
                      today: todaySteps[player] || 0,
                      yesterday: yesterdaySteps[player] || 0,
                      change: (todaySteps[player] || 0) - (yesterdaySteps[player] || 0)
                    }))
                    .sort((a, b) => a.change - b.change)
                    .slice(0, 3);
                    
                    return changes.map((player) => (
                      <div key={player.name} className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-sm md:text-base">{player.name}</div>
                          <div className="text-xs text-gray-400">{player.yesterday.toLocaleString()} → {player.today.toLocaleString()}</div>
                        </div>
                        <div className="text-red-400 font-bold">{player.change.toLocaleString()}</div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Rank Climbers */}
              <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-600 rounded-lg p-4 md:p-6">
                <h3 className="text-blue-400 font-bold mb-4 flex items-center gap-2">
                  ⬆️ Rank Climbers
                </h3>
                <div className="space-y-3">
                  {(() => {
                    // Calculate Day 1 rankings
                    const day1Data = getDailyStepsForAllPlayers(1);
                    const day1Rankings = players
                      .map((player, idx) => ({
                        name: player,
                        rank: idx + 1,
                        total: day1Data[player] || 0
                      }))
                      .sort((a, b) => b.total - a.total)
                      .map((p, idx) => ({ ...p, rank: idx + 1 }));

                    // Find climbers (moved up from Day 1)
                    const climbers = rankings
                      .map(r => {
                        const day1Rank = day1Rankings.find(d => d.name === r.name)?.rank || 999;
                        const currentRank = rankings.indexOf(r) + 1;
                        const movement = day1Rank - currentRank;
                        return { ...r, movement, day1Rank, currentRank };
                      })
                      .filter(c => c.movement > 0)
                      .sort((a, b) => b.movement - a.movement)
                      .slice(0, 3);

                    return climbers.length > 0 ? (
                      climbers.map((player, idx) => (
                        <div key={player.name} className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-sm md:text-base">{player.name}</div>
                            <div className="text-xs text-gray-400">#{player.day1Rank} → #{player.currentRank}</div>
                          </div>
                          <div className="text-blue-400 font-bold">+{player.movement}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-400 text-sm">No changes yet</div>
                    );
                  })()}
                </div>
              </div>

              {/* Rank Fallers */}
              <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/20 border border-orange-600 rounded-lg p-4 md:p-6">
                <h3 className="text-orange-400 font-bold mb-4 flex items-center gap-2">
                  ⬇️ Rank Fallers
                </h3>
                <div className="space-y-3">
                  {(() => {
                    // Calculate Day 1 rankings
                    const day1Data = getDailyStepsForAllPlayers(1);
                    const day1Rankings = players
                      .map((player, idx) => ({
                        name: player,
                        rank: idx + 1,
                        total: day1Data[player] || 0
                      }))
                      .sort((a, b) => b.total - a.total)
                      .map((p, idx) => ({ ...p, rank: idx + 1 }));

                    // Find fallers (moved down from Day 1)
                    const fallers = rankings
                      .map(r => {
                        const day1Rank = day1Rankings.find(d => d.name === r.name)?.rank || 999;
                        const currentRank = rankings.indexOf(r) + 1;
                        const movement = day1Rank - currentRank;
                        return { ...r, movement, day1Rank, currentRank };
                      })
                      .filter(c => c.movement < 0)
                      .sort((a, b) => a.movement - b.movement)
                      .slice(0, 3);

                    return fallers.length > 0 ? (
                      fallers.map((player, idx) => (
                        <div key={player.name} className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-sm md:text-base">{player.name}</div>
                            <div className="text-xs text-gray-400">#{player.day1Rank} → #{player.currentRank}</div>
                          </div>
                          <div className="text-orange-400 font-bold">{player.movement}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-400 text-sm">No changes yet</div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Daily Steps for Selected Day */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-4 md:p-6 mb-8 md:mb-12">
            <h2 className="text-lg md:text-2xl font-bold mb-4 md:mb-6">Day {selectedDay} Steps</h2>
            
            {/* Mobile: Card View */}
            <div className="md:hidden space-y-2">
              {dayRankings.map((player, idx) => (
                <div key={player.name} className="bg-gray-700/30 rounded-lg p-3 border border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-400 w-6">{idx + 1}</span>
                      <div>
                        <div className="font-semibold text-sm truncate max-w-xs">{player.name}</div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-2 text-xs text-gray-400">
                    {(() => {
                      const feetWalked = (player.steps || 0) * 2.5;
                      const distance = UNIQUE_DISTANCES[idx % UNIQUE_DISTANCES.length];
                      const percentage = ((feetWalked / distance.distance) * 100).toFixed(1);
                      return `${percentage}% to ${distance.name}`;
                    })()}
                  </div>
                  <div className="flex justify-between text-xs md:text-sm">
                    <div>
                      <div className="text-gray-400">Today</div>
                      <div className="text-cyan-400 font-bold">{(player.steps || 0).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-400">Total</div>
                      <div className="text-yellow-300 font-bold">{player.cumulative.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm md:text-base">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-900/50">
                    <th className="px-6 py-3 text-left text-gray-400 font-semibold text-xs md:text-sm">#</th>
                    <th className="px-6 py-3 text-left text-gray-400 font-semibold text-xs md:text-sm">Name</th>
                    <th className="px-6 py-3 text-right text-gray-400 font-semibold text-xs md:text-sm">Today</th>
                    <th className="px-6 py-3 text-left text-gray-400 font-semibold text-xs md:text-sm">Daily Progress</th>
                    <th className="px-6 py-3 text-right text-gray-400 font-semibold text-xs md:text-sm">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {dayRankings.map((player, idx) => (
                    <tr
                      key={player.name}
                      className="border-b border-gray-700 hover:bg-gray-700/30 transition"
                    >
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-300 text-xs md:text-base">{idx + 1}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-sm truncate max-w-xs">{player.name}</div>
                      </td>
                      <td className="px-6 py-4 text-right text-cyan-400 font-bold text-xs md:text-base">
                        {(player.steps || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-left text-sm text-gray-300">
                        {(() => {
                          const feetWalked = (player.steps || 0) * 2.5;
                          const distance = UNIQUE_DISTANCES[idx % UNIQUE_DISTANCES.length];
                          const percentage = ((feetWalked / distance.distance) * 100).toFixed(1);
                          return `${percentage}% to ${distance.name}`;
                        })()}
                      </td>
                      <td className="px-6 py-4 text-right text-yellow-300 font-bold text-xs md:text-base">
                        {player.cumulative.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </div>
          )}

          {/* TAB 2: OVERALL */}
          {activeTab === 'overall' && (
          <div>

          {/* Cumulative Chart */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-4 md:p-6 mb-8 md:mb-12">
            <h2 className="text-lg md:text-2xl font-bold mb-4 md:mb-6 flex items-center gap-2">
              <TrendingUp className="text-blue-400" size={24} />
              Progress Trend
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="day" stroke="#888" tick={{ fontSize: 10 }} />
                <YAxis stroke="#888" tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #444', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                {rankings.map((player, idx) => (
                  <Line
                    key={player.name}
                    type="monotone"
                    dataKey={player.name}
                    stroke={colors[idx % colors.length]}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <p className="text-gray-400 text-xs md:text-sm mt-4">All {players.length} players • Cumulative totals</p>
          </div>

          {/* Overall Leaderboard */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-700">
              <h2 className="text-lg md:text-2xl font-bold">Cumulative Leaderboard</h2>
            </div>
            
            {/* Mobile: Card View */}
            <div className="md:hidden space-y-2 p-4">
              {rankings.map((player, idx) => (
                <div
                  key={player.name}
                  onClick={() => {
                    setSelectedPlayer(selectedPlayer === player.name ? null : player.name);
                    setShowCompletedDistances(false);
                  }}
                  className={`rounded-lg p-4 border cursor-pointer transition ${
                    idx < 3 ? 'bg-gray-700/40' : 'bg-gray-800/40'
                  } ${selectedPlayer === player.name ? 'border-blue-500 bg-blue-900/30' : 'border-gray-600'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold">{getMedalEmoji(idx + 1)}</span>
                      <div>
                        <div className="font-bold text-sm text-white truncate">{player.name}</div>
                        <div className="text-xs text-gray-400">#{idx + 1}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {player.prize > 0 && (
                        <div className="font-bold text-green-400 text-sm">${player.prize}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-yellow-300 font-bold text-base mb-1">
                    {player.total.toLocaleString()} steps
                  </div>
                  <div className="text-xs text-gray-300 mb-2">
                    {getUniqueDistance(idx, player.total)}
                  </div>
                  <div className="text-blue-300 font-semibold text-sm">
                    Daily Payouts: ${player.dailyPayouts.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm md:text-base">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-900/50">
                    <th className="px-6 py-3 text-left text-gray-400 font-semibold">#</th>
                    <th className="px-6 py-3 text-left text-gray-400 font-semibold">Player</th>
                    <th className="px-6 py-3 text-right text-gray-400 font-semibold">Steps</th>
                    <th className="px-6 py-3 text-left text-gray-400 font-semibold">Fun Fact</th>
                    <th className="px-6 py-3 text-right text-gray-400 font-semibold">Daily Payouts</th>
                    <th className="px-6 py-3 text-right text-gray-400 font-semibold">Prize</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((player, idx) => (
                    <tr
                      key={player.name}
                      onClick={() => {
                        setSelectedPlayer(selectedPlayer === player.name ? null : player.name);
                        setShowCompletedDistances(false);
                      }}
                      className={`border-b border-gray-700 hover:bg-gray-700/30 transition cursor-pointer ${
                        idx < 3 ? 'bg-gray-700/20' : ''
                      } ${selectedPlayer === player.name ? 'bg-blue-900/40 border-l-4 border-blue-500' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <span className="text-lg font-bold">
                          {getMedalEmoji(idx + 1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-blue-300 hover:text-blue-200">{player.name}</td>
                      <td className="px-6 py-4 text-right text-yellow-300 font-bold">
                        {player.total.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-left text-sm text-gray-300">
                        {getUniqueDistance(idx, player.total)}
                      </td>
                      <td className="px-6 py-4 text-right text-blue-300 font-semibold">
                        ${player.dailyPayouts.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {player.prize > 0 ? (
                          <span className="font-bold text-green-400">${player.prize}</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Selected Player Distances */}
            {selectedPlayer && (
              <div className="mt-6 p-4 md:p-6 bg-blue-900/20 border border-blue-600 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-blue-400 font-bold text-lg">
                    {selectedPlayer}'s Progress to Caribbean Destinations
                  </h3>
                  <button
                    onClick={() => setShowCompletedDistances(!showCompletedDistances)}
                    className={`px-3 py-1 text-sm rounded font-semibold transition-colors ${
                      showCompletedDistances
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {showCompletedDistances ? '✓ Show Completed' : 'Show Completed'}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(() => {
                    const playerData = rankings.find(r => r.name === selectedPlayer);
                    if (!playerData) return null;
                    
                    const feetWalked = playerData.total * 2.5;
                    
                    // Create array with distances and percentages, then sort by percentage descending
                    const distancesWithProgress = UNIQUE_DISTANCES
                      .map(distance => ({
                        ...distance,
                        percentage: parseFloat(((feetWalked / distance.distance) * 100).toFixed(1))
                      }))
                      .filter(item => {
                        const isCompleted = item.percentage > 100;
                        // Filter: show if under 100%, or if over 100% and showCompletedDistances is true
                        return isCompleted ? showCompletedDistances : true;
                      })
                      .sort((a, b) => b.percentage - a.percentage); // Sort descending by percentage
                    
                    return distancesWithProgress.map(distance => {
                      const isCompleted = distance.percentage > 100;
                      const distanceMiles = (distance.distance / 5280).toFixed(1);
                      
                      let displayText;
                      if (isCompleted) {
                        const timesCompleted = (distance.percentage / 100).toFixed(1);
                        displayText = `Completed ${timesCompleted}× (${distanceMiles} mi)`;
                      } else {
                        displayText = `${distance.percentage.toFixed(1)}% (${distanceMiles} mi)`;
                      }
                      
                      return (
                        <div key={distance.name} className={`p-3 rounded border ${
                          isCompleted
                            ? 'bg-green-900/30 border-green-600'
                            : 'bg-gray-800/50 border-gray-700'
                        }`}>
                          <div className="text-sm text-gray-300">{distance.name}</div>
                          <div className={`text-lg font-bold mt-1 ${
                            isCompleted ? 'text-green-400' : 'text-blue-300'
                          }`}>
                            {displayText}
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                isCompleted ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min(distance.percentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Personal Performance Stats */}
          <div className="mb-8 md:mb-12">
            <h2 className="text-lg md:text-2xl font-bold mb-4 md:mb-6 flex items-center gap-2">
              <Zap className="text-red-400" size={24} />
              Personal Performance
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Streaks */}
              <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 border border-red-600 rounded-lg p-4 md:p-6">
                <h3 className="text-red-400 font-bold mb-4 flex items-center gap-2">
                  🔥 Current Streaks (10k+ steps)
                </h3>
                <div className="space-y-3">
                  {(() => {
                    const streaks = {};
                    
                    // Calculate current streak for each player
                    players.forEach(player => {
                      let currentStreak = 0;
                      let longestStreak = 0;
                      let tempStreak = 0;
                      
                      // Loop through all days
                      for (let day = 1; day <= monthData.challenge.currentDay; day++) {
                        
                        const daySteps = getDailySteps(day, player);
                        
                        if (daySteps >= 10000) {
                          tempStreak++;
                          currentStreak = tempStreak;
                        } else {
                          if (tempStreak > longestStreak) {
                            longestStreak = tempStreak;
                          }
                          tempStreak = 0;
                        }
                      }
                      if (tempStreak > longestStreak) {
                        longestStreak = tempStreak;
                      }
                      
                      streaks[player] = { current: currentStreak, longest: longestStreak };
                    });
                    
                    // Sort by current streak
                    const sortedStreaks = Object.entries(streaks)
                      .sort((a, b) => b[1].current - a[1].current)
                      .filter(([_, s]) => s.current > 0)
                      .slice(0, 8);
                    
                    return sortedStreaks.length > 0 ? (
                      sortedStreaks.map(([name, streak]) => (
                        <div key={name} className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-sm md:text-base">{name}</div>
                            <div className="text-xs text-gray-400">Best: {streak.longest} days</div>
                          </div>
                          <div className="text-red-400 font-bold text-lg bg-red-900/40 px-3 py-1 rounded">{streak.current}🔥</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-400 text-sm">No active streaks yet</div>
                    );
                  })()}
                </div>
              </div>

              {/* Personal Bests */}
              <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-600 rounded-lg p-4 md:p-6">
                <h3 className="text-green-400 font-bold mb-4 flex items-center gap-2">
                  💪 Personal Bests (Single Day)
                </h3>
                <div className="space-y-3">
                  {(() => {
                    const personalBests = {};
                    
                    // Calculate personal best for each player
                    players.forEach(player => {
                      let bestDay = 0;
                      let bestDayNum = 0;
                      
                      for (let day = 1; day <= monthData.challenge.currentDay; day++) {
                        
                        const daySteps = getDailySteps(day, player);
                        
                        if (daySteps > bestDay) {
                          bestDay = daySteps;
                          bestDayNum = day;
                        }
                      }
                      
                      personalBests[player] = { steps: bestDay, day: bestDayNum };
                    });
                    
                    // Sort by personal best
                    const sortedBests = Object.entries(personalBests)
                      .sort((a, b) => b[1].steps - a[1].steps)
                      .slice(0, 8);
                    
                    return sortedBests.map(([name, best]) => (
                      <div key={name} className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-sm md:text-base">{name}</div>
                          <div className="text-xs text-gray-400">Day {best.day}</div>
                        </div>
                        <div className="text-green-400 font-bold text-lg bg-green-900/40 px-3 py-1 rounded">{best.steps.toLocaleString()}</div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard Stats */}
          <div className="mb-8 md:mb-12">
            <h2 className="text-lg md:text-2xl font-bold mb-4 md:mb-6 flex items-center gap-2">
              <Award className="text-purple-400" size={24} />
              Leaderboard Stats
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1st Place Most */}
              <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border border-yellow-600 rounded-lg p-4 md:p-6">
                <h3 className="text-yellow-400 font-bold mb-4 flex items-center gap-2">
                  🥇 1st Place Most
                </h3>
                <div className="space-y-3">
                  {(() => {
                    const firstPlaceTally = {};
                    
                    // Count how many times each player was 1st
                    for (let day = 1; day <= monthData.challenge.currentDay; day++) {
                      const dayRankings = players
                        .map(player => ({
                          name: player,
                          total: getDailySteps(day, player) || 0
                        }))
                        .sort((a, b) => b.total - a.total);
                      
                      if (dayRankings.length > 0) {
                        const firstPlace = dayRankings[0].name;
                        firstPlaceTally[firstPlace] = (firstPlaceTally[firstPlace] || 0) + 1;
                      }
                    }
                    
                    // Get top 5 most frequent 1st place finishers
                    const top5First = Object.entries(firstPlaceTally)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5);
                    
                    return top5First.length > 0 ? (
                      top5First.map(([name, count]) => (
                        <div key={name} className="flex justify-between items-center">
                          <div className="font-semibold text-sm md:text-base">{name}</div>
                          <div className="text-yellow-400 font-bold bg-yellow-900/40 px-3 py-1 rounded">{count}x</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-400 text-sm">No data yet</div>
                    );
                  })()}
                </div>
              </div>

              {/* Last Place Most */}
              <div className="bg-gradient-to-br from-gray-900/30 to-gray-800/20 border border-gray-600 rounded-lg p-4 md:p-6">
                <h3 className="text-gray-400 font-bold mb-4 flex items-center gap-2">
                  📉 Last Place Most
                </h3>
                <div className="space-y-3">
                  {(() => {
                    const lastPlaceTally = {};
                    
                    // Count how many times each player was last
                    for (let day = 1; day <= monthData.challenge.currentDay; day++) {
                      const dayRankings = players
                        .map(player => ({
                          name: player,
                          total: getDailySteps(day, player) || 0
                        }))
                        .sort((a, b) => b.total - a.total);
                      
                      if (dayRankings.length > 0) {
                        const lastPlace = dayRankings[dayRankings.length - 1].name;
                        lastPlaceTally[lastPlace] = (lastPlaceTally[lastPlace] || 0) + 1;
                      }
                    }
                    
                    // Get top 5 most frequent last place finishers
                    const top5Last = Object.entries(lastPlaceTally)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5);
                    
                    return top5Last.length > 0 ? (
                      top5Last.map(([name, count]) => (
                        <div key={name} className="flex justify-between items-center">
                          <div className="font-semibold text-sm md:text-base">{name}</div>
                          <div className="text-gray-400 font-bold bg-gray-800/40 px-3 py-1 rounded">{count}x</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-400 text-sm">No data yet</div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
          </div>
          )}

          {/* Footer */}
          <div className="mt-8 md:mt-12 text-center text-gray-500 text-xs md:text-sm border-t border-gray-700 pt-6 md:pt-8 pb-4">
            <p>Day {monthData.challenge.currentDay} • Update: 9:00pm</p>
            <p className="mt-2">Good luck, Stompers! 👟⚡</p>
          </div>
        </div>
      </div>
    </>
  );
}
