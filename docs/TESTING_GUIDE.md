# 🧪 Testing Your eRoyal App

## ✅ Pre-Test Checklist

Before testing, confirm:
- [ ] Firebase Authentication enabled (Email/Password)
- [ ] Firestore database created
- [ ] Firebase Storage enabled
- [ ] Admin account created (admin@eroyal.com)
- [ ] Admin user document in Firestore

## 🚀 Test Plan

### Test 1: Admin Login & Dashboard
1. Open app: http://localhost:8081
2. Login with:
   - Email: `admin@eroyal.com`
   - Password: `Admin@123`
3. ✅ Should redirect to Admin Dashboard
4. ✅ Should see welcome message with your name
5. ✅ Should see statistics (0 pending items initially)

### Test 2: Create Resident Account
1. From Admin Dashboard → Click "User Management"
2. Click "Create New User"
3. Fill form:
   - Name: `John Doe`
   - Email: `john@test.com`
   - Password: Click "Generate" (or use `Test@123`)
   - Role: Select "Resident"
   - House No: `A-12`
4. Click "Create Account"
5. ✅ Should show success message
6. **Note down the password!**

### Test 3: Create Security Account
1. Back to Dashboard → User Management → Create New User
2. Fill form:
   - Name: `Security Guard`
   - Email: `security@test.com`
   - Password: `Test@123`
   - Role: Select "Security"
3. Click "Create Account"
4. ✅ Should show success message

### Test 4: Generate Bill
1. Dashboard → Bills Management → Create Bill
2. Select: John Doe (A-12) from dropdown
3. Fill:
   - Month: `December 2025`
   - Amount: `5000`
   - Due Date: `2025-12-31`
4. Click "Create Bill"
5. ✅ Should show success
6. Go to Bills → View All
7. ✅ Should see the bill

### Test 5: Resident Login & Pay Bill
1. Logout from admin
2. Login as:
   - Email: `john@test.com`
   - Password: [the one you created]
3. ✅ Should redirect to Resident Home
4. ✅ Should see 1 Unpaid Bill
5. Click "Bills" → View the bill
6. Click "Upload Payment Proof"
7. Select any image (screenshot, etc.)
8. Click "Upload Proof"
9. ✅ Should show success

### Test 6: Verify Payment (Admin)
1. Logout from resident
2. Login as admin
3. Dashboard → Bills → Verify Payments
4. ✅ Should see John's payment proof
5. Click image to enlarge
6. Click "Approve"
7. ✅ Bill status should change to "Paid"

### Test 7: Submit Complaint (Resident)
1. Logout, login as resident
2. Click Complaints → Submit New Complaint
3. Fill:
   - Title: `Water leak in bathroom`
   - Category: `Maintenance`
   - Description: `Water is leaking from the ceiling`
   - Add photo (optional)
4. Click "Submit Complaint"
5. ✅ Should show success

### Test 8: Manage Complaint (Admin)
1. Login as admin
2. Complaints → View All
3. Click on the complaint
4. Update Status → "In Progress"
5. Add admin notes
6. ✅ Status should update

### Test 9: Post Marketplace Listing (Resident)
1. Login as resident
2. Marketplace → Post Property
3. Fill:
   - Type: Rent/Sell
   - Price: `50000`
   - Size: `5 Marla`
   - Location: `A-12`
   - Contact: `0300-1234567`
   - Description: `Beautiful house for rent`
   - Add 2-3 photos
4. Click "Submit for Approval"
5. ✅ Should show pending approval message

### Test 10: Approve Listing (Admin)
1. Login as admin
2. Marketplace → Pending tab
3. View the listing
4. Click "Approve"
5. ✅ Should move to Approved tab
6. Login as resident
7. Marketplace → Browse
8. ✅ Should see the approved listing

### Test 11: Security Gate Entry
1. Login as:
   - Email: `security@test.com`
   - Password: `Test@123`
2. ✅ Should see Gate Entry screen
3. Fill:
   - Vehicle Type: Resident
   - Vehicle Number: `LEA-1234`
   - House Number: `A-12`
4. Click "Search"
5. ✅ Should show John Doe details
6. Click "Log Entry"
7. ✅ Should show success

### Test 12: View Vehicle Logs (Resident)
1. Login as resident (john@test.com)
2. Click "My Vehicles"
3. ✅ Should see the LEA-1234 entry

---

## 🎉 Success Criteria

**All 12 tests passed?** 
Your eRoyal system is 100% functional! 🚀

**Some tests failed?** 
Note which ones and let me know - I'll help debug!

---

## 📊 What You've Tested

✅ Authentication for all 3 roles
✅ User creation by admin
✅ Bill generation & payment verification
✅ Complaint submission & management
✅ Marketplace with approval workflow
✅ Vehicle entry logging
✅ Real-time data synchronization
✅ Image uploads
✅ Role-based access control

**Your complete Housing Society Management System is ready!** 🏘️
