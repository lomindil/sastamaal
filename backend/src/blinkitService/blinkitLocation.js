import crypto from "crypto";

const HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
  "accept": "application/json, text/plain, */*",
  "origin": "https://blinkit.com",
  "referer": "https://blinkit.com/"
};

const getLocation = async (query) => {
  const sessionToken = crypto.randomUUID();

  const url = `https://blinkit.com/location/autoSuggest?query=${encodeURIComponent(
    query
  )}&lat=28.4652382&lng=77.0615957&session_token=${sessionToken}`;

  const res = await fetch(url, { headers: HEADERS });
  return res.json();
};

const getLatLon = async (query) => {
  const data = await getLocation(query);
  const s = data.ui_data.suggestions[0];

  const url = `https://blinkit.com/location/info?place_id=${s.meta.place_id}&title=${encodeURIComponent(
    s.title.text
  )}&description=${encodeURIComponent(
    s.subtitle.text
  )}&is_pin_moved=false&session_token=${s.meta.session_token}`;

  const res = await fetch(url, { headers: HEADERS });
  return res.json();
};

export const getLocationInfo = async (query) => {
  const info = await getLatLon(query);

  return {
    lat: info.coordinate.lat,
    lon: info.coordinate.lon,
    locality: info.city,
    landmark: info.display_address.address_line
  };
};
