import time
import json
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

URL = "http://localhost:3000/api/search"

HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Cookie": "lat=28.4646148; lon=77.0299194; address=Gurgaon, Haryana, India"
}

PAYLOAD = {"query": "milk"}

CONCURRENT_USERS = 6
TOTAL_REQUESTS = 30
TIMEOUT = 60

def invoke_api(user_id):
    start_time = time.time()
    try:
        response = requests.post(
            URL,
            headers=HEADERS,
            json=PAYLOAD,
            timeout=TIMEOUT
        )
        duration = time.time() - start_time

        return {
            "user_id": user_id,
            "error": f"HTTP {response.status_code}",
            "duration": duration,
            "result": response.json() if response.headers.get("Content-Type", "").startswith("application/json") else None
        }

    except Exception as e:
        return {
            "user_id": user_id,
            "error": str(e),
            "duration": None
        }


def start_load_test():
    print("\n🚀 Running load test")
    print(f"Concurrent users: {CONCURRENT_USERS}")
    print(f"Total requests: {TOTAL_REQUESTS}\n")

    results = []
    start_test = time.time()

    with ThreadPoolExecutor(max_workers=CONCURRENT_USERS) as executor:
        futures = [
            executor.submit(invoke_api, i)
            for i in range(TOTAL_REQUESTS)
        ]

        for future in as_completed(futures):
            result = future.result()
            if result:
                results.append(result)

    with open("finalresult.json", "w") as f:
        json.dump(results, f, indent=2)

    total_time = time.time() - start_test

    response_times = [entry["duration"] for entry in results if entry.get("duration") is not None]
    avg_time = sum(response_times) / len(response_times) if response_times else 0

    print("📊 Load Test Summary")
    print("-------------------")
    print(f"Total Requests: {TOTAL_REQUESTS}")
    print(f"Average Response Time: {avg_time:.2f}s")
    print(f"Total Test Time: {total_time:.2f}s")



if __name__ == "__main__":
    start_load_test()
