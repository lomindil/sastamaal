import time
import json
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

URL = "https://39fba617d9ed.ngrok-free.app/api/search"

HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Cookie": "lat=28.4646148; lon=77.0299194; address=Gurgaon, Haryana, India"
}

PAYLOAD = {"query": "milk"}

CONCURRENT_USERS = 5
TOTAL_REQUESTS = 10
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

    errors = []
    start_test = time.time()

    with ThreadPoolExecutor(max_workers=CONCURRENT_USERS) as executor:
        futures = [
            executor.submit(invoke_api, i)
            for i in range(TOTAL_REQUESTS)
        ]

        for future in as_completed(futures):
            result = future.result()
            if result:
                errors.append(result)

    with open("result.json", "w") as f:
        json.dump(errors, f, indent=2)

    total_time = time.time() - start_test

    print("📊 Load Test Summary")
    print("-------------------")
    print(f"Total Requests: {TOTAL_REQUESTS}")
    print(f"Errors: {len(errors)}")
    print(f"Total Test Time: {total_time:.2f}s")

    if errors:
        with open("errors.json", "w") as f:
            json.dump(errors, f, indent=2)
        print("❌ Errors saved to errors.json")
    else:
        print("✅ No errors detected")


if __name__ == "__main__":
    start_load_test()
