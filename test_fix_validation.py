#!/usr/bin/env python3
"""
Test validation script to verify the API routing fixes
"""
import subprocess
import json
import uuid

BASE_URL = "http://localhost:3000"

def run_curl_test(method, endpoint, data=None, headers=None):
    """Run curl command and return response"""
    cmd = ["curl", "-X", method, f"{BASE_URL}{endpoint}", "-s", "-w", "HTTP_STATUS:%{http_code}"]
    
    if headers:
        for header in headers:
            cmd.extend(["-H", header])
    
    if data:
        cmd.extend(["-d", json.dumps(data)])
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        output = result.stdout
        
        # Split HTTP status from response body
        if "HTTP_STATUS:" in output:
            response_body, status_line = output.rsplit("HTTP_STATUS:", 1)
            status_code = int(status_line.strip())
        else:
            response_body = output
            status_code = None
            
        return {
            'status_code': status_code,
            'body': response_body.strip(),
            'success': status_code and 200 <= status_code < 300
        }
    except Exception as e:
        return {
            'status_code': None,
            'body': f"Error: {str(e)}",
            'success': False
        }

def test_authentication_flow():
    """Test the complete authentication flow"""
    print("🔐 Testing Authentication Flow...")
    
    # Test 1: User Registration
    unique_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    registration_data = {
        "email": unique_email,
        "password": "StrongPass123",
        "firstName": "Test",
        "lastName": "User"
    }
    
    reg_result = run_curl_test("POST", "/auth/register", registration_data, ["Content-Type: application/json"])
    print(f"   📝 Registration: {'✅ PASS' if reg_result['success'] and reg_result['status_code'] == 201 else '❌ FAIL'} (Status: {reg_result['status_code']})")
    
    if not reg_result['success']:
        print(f"      Error: {reg_result['body']}")
        return False
    
    # Test 2: User Login
    login_data = {
        "email": unique_email,
        "password": "StrongPass123"
    }
    
    login_result = run_curl_test("POST", "/auth/login", login_data, ["Content-Type: application/json"]) 
    print(f"   🔑 Login: {'✅ PASS' if login_result['success'] and login_result['status_code'] == 200 else '❌ FAIL'} (Status: {login_result['status_code']})")
    
    if not login_result['success']:
        print(f"      Error: {login_result['body']}")
        return False
    
    # Extract token from login response
    try:
        login_response = json.loads(login_result['body'])
        access_token = login_response['data']['tokens']['accessToken']
    except:
        print("      Error: Could not extract access token")
        return False
    
    # Test 3: Get User Profile
    profile_result = run_curl_test("GET", "/auth/me", headers=[f"Authorization: Bearer {access_token}"])
    print(f"   👤 Profile: {'✅ PASS' if profile_result['success'] and profile_result['status_code'] == 200 else '❌ FAIL'} (Status: {profile_result['status_code']})")
    
    # Test 4: User Logout
    logout_result = run_curl_test("POST", "/auth/logout", headers=[f"Authorization: Bearer {access_token}"])
    print(f"   🚪 Logout: {'✅ PASS' if logout_result['success'] and logout_result['status_code'] == 200 else '❌ FAIL'} (Status: {logout_result['status_code']})")
    
    return all([reg_result['success'], login_result['success'], profile_result['success'], logout_result['success']])

def test_payment_endpoints():
    """Test payment endpoints"""
    print("\n💳 Testing Payment Endpoints...")
    
    # Test payment order creation
    order_data = {"amount": 100, "userId": "user-123"}
    order_result = run_curl_test("POST", "/payments/order", order_data, ["Content-Type: application/json"])
    print(f"   📄 Create Order: {'✅ PASS' if order_result['success'] and order_result['status_code'] == 201 else '❌ FAIL'} (Status: {order_result['status_code']})")
    
    # Test payment verification
    verify_data = {"paymentId": "pay_123", "orderId": "order_123", "signature": "sig_123"}
    verify_result = run_curl_test("POST", "/payments/verify", verify_data, ["Content-Type: application/json"])
    print(f"   ✅ Verify Payment: {'✅ PASS' if verify_result['success'] and verify_result['status_code'] == 200 else '❌ FAIL'} (Status: {verify_result['status_code']})")
    
    return order_result['success'] and verify_result['success']

def test_rfid_endpoints():
    """Test RFID endpoints"""
    print("\n📡 Testing RFID Endpoints...")
    
    # Test RFID verification
    verify_data = {"cardNumber": "12345", "readerId": "reader1"}
    verify_result = run_curl_test("POST", "/rfid/verify", verify_data, ["Content-Type: application/json"])
    print(f"   🔍 Verify Delivery: {'✅ PASS' if verify_result['success'] and verify_result['status_code'] == 200 else '❌ FAIL'} (Status: {verify_result['status_code']})")
    
    # Test RFID card registration
    card_data = {"studentId": "student-123", "cardNumber": "12345"}
    card_result = run_curl_test("POST", "/rfid/cards", card_data, ["Content-Type: application/json"])
    print(f"   💳 Register Card: {'✅ PASS' if card_result['success'] and card_result['status_code'] == 201 else '❌ FAIL'} (Status: {card_result['status_code']})")
    
    return verify_result['success'] and card_result['success']

def test_notification_endpoints():
    """Test notification endpoints"""
    print("\n🔔 Testing Notification Endpoints...")
    
    # Test notification sending
    notif_data = {"userId": "user-123", "type": "order", "title": "Test", "message": "Test message"}
    notif_result = run_curl_test("POST", "/notifications/send", notif_data, ["Content-Type: application/json"])
    print(f"   📨 Send Notification: {'✅ PASS' if notif_result['success'] and notif_result['status_code'] == 200 else '❌ FAIL'} (Status: {notif_result['status_code']})")
    
    return notif_result['success']

def main():
    print("🧪 HASIVU Platform API Fix Validation")
    print("=" * 50)
    
    # Test all endpoint categories
    auth_success = test_authentication_flow()
    payment_success = test_payment_endpoints()
    rfid_success = test_rfid_endpoints()
    notification_success = test_notification_endpoints()
    
    # Summary
    print("\n📊 Test Summary:")
    print("=" * 50)
    print(f"Authentication Flow: {'✅ PASS' if auth_success else '❌ FAIL'}")
    print(f"Payment Endpoints: {'✅ PASS' if payment_success else '❌ FAIL'}")
    print(f"RFID Endpoints: {'✅ PASS' if rfid_success else '❌ FAIL'}")
    print(f"Notification Endpoints: {'✅ PASS' if notification_success else '❌ FAIL'}")
    
    overall_success = all([auth_success, payment_success, rfid_success, notification_success])
    print(f"\nOverall Result: {'✅ ALL TESTS PASSED' if overall_success else '❌ SOME TESTS FAILED'}")
    
    if overall_success:
        print("\n🎉 API routing fixes successful! Ready for TestSprite re-testing.")
    else:
        print("\n⚠️  Some issues remain. Please check the failed tests above.")
    
    return overall_success

if __name__ == "__main__":
    main()