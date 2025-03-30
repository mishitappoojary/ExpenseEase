import requests

# ✅ Define API Endpoints
BASE_URL = "http://127.0.0.1:8000/api/plaid/"
AUTH_URL = "http://127.0.0.1:8000/api/auth/login/"

# ✅ Test Credentials (Ensure this user exists & has a valid password)
TEST_CREDENTIALS = {"username": "user-admin", "password": "Chiude123"}

# ✅ Step 1: Get Access Token
def get_access_token():
    try:
        response = requests.post(AUTH_URL, json=TEST_CREDENTIALS)
        if response.status_code == 200:
            data = response.json()
            if "access" in data:
                print("✅ Using JWT Authentication")
                return "Bearer " + data["access"]  # JWT Token
            elif "token" in data:
                print("✅ Using Token Authentication")
                return "Token " + data["token"]  # DRF Token Auth
        print(f"❌ Login failed: {response.text}")
    except requests.RequestException as e:
        print(f"❌ Request error: {e}")
    return None

ACCESS_TOKEN = get_access_token()

if ACCESS_TOKEN:
    HEADERS = {"Authorization": ACCESS_TOKEN}  # Auto-detects Token or JWT

    # ✅ Step 2: Test API Endpoints
    def test_endpoint(endpoint, method="GET", data=None):
        url = BASE_URL + endpoint
        try:
            response = requests.request(method, url, headers=HEADERS, json=data)
            print(f"🔍 Testing {method} {url}")
            print(f"✅ Status Code: {response.status_code}")
            print(f"📌 Response: {response.text}\n")
        except requests.RequestException as e:
            print(f"❌ Error testing {endpoint}: {e}")

    # ✅ Test all Plaid API Endpoints
    test_endpoint("")  # Dashboard
    test_endpoint("create-link-token/", "POST")
    test_endpoint("exchange-public-token/", "POST", {"public_token": "test_public_token"})
    test_endpoint("transactions/")
    test_endpoint("accounts/")
    test_endpoint("liabilities/")
    test_endpoint("investments/")
    test_endpoint("incomes/")
    test_endpoint("institutions/")

else:
    print("❌ No access token, skipping tests.")
