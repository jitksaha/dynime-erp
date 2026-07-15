# Dynime ERP - Cloudflare R2 & Storage Configuration Guide

এই ফাইলটি আপনার Dynime ERP-এর স্টোরেজ ও ক্লাউডফ্লেয়ার R2 সিঙ্ক কনফিগার করার জন্য একটি স্থায়ী নির্দেশিকা।

---

## ১. Active Storage Type Check
বর্তমানে আপনার ERP সিস্টেমে ফাইল স্টোরেজ হিসেবে **Local** সিলেক্ট করা আছে। অর্থাৎ সমস্ত আপলোড করা ইমেজ ও ডকুমেন্ট সার্ভারের লোকাল স্টোরেজে (`public/storage/media/`) আপলোড হচ্ছে।

---

## ২. R2 Storage Configuration (সরাসরি Company Admin Settings থেকে)
সুপার এডমিন প্যানেলের প্রয়োজন নেই, সরাসরি **Company Admin (Owner)** ড্যাশবোর্ড থেকে Cloudflare R2 সচল করতে পারবেন:

### ধাপসমূহ:
1. আপনার **Company Admin (Owner)** অ্যাকাউন্ট দিয়ে লগইন করুন।
2. বাম পাশের মেন্যু থেকে **Settings**-এ যান।
3. **System Settings** অথবা **Storage Settings** ট্যাবে ক্লিক করুন।
4. **Storage Type** ড্রপডাউন থেকে **AWS S3** সিলেক্ট করুন এবং নিচের তথ্যগুলো পূরণ করুন:

| ERP Settings Field | Cloudflare R2 Value | Format / Example |
| :--- | :--- | :--- |
| **Storage Type** | AWS S3 | `AWS S3` |
| **AWS Access Key ID** | R2 Token-এর Access Key ID | `46ebfc7279cc491d9658d5407702e736` |
| **AWS Secret Access Key** | R2 Token-এর Secret Access Key | `9658d5407702e736a4f8cf...` |
| **AWS Default Region** | R2 Default Region | `auto` (অথবা `us-east-1`) |
| **AWS Bucket Name** | আপনার Cloudflare R2 Bucket-এর নাম | `dynime` |
| **AWS Endpoint** | Cloudflare R2 S3 API Endpoint URL | `https://<your_account_id>.r2.cloudflarestorage.com` |
| **AWS Custom URL** | আপনার Cloudflare CDN-এর ডোমেইন লিঙ্ক | **`https://cdn.dynime.com/`** |

> [!IMPORTANT]
> **AWS Custom URL** ফিল্ডে অবশ্যই শেষ মাথায় স্ল্যাশসহ **`https://cdn.dynime.com/`** বসাবেন। এর ফলে সমস্ত আপলোড করা ইমেজের লিঙ্ক সরাসরি আপনার ফাস্ট স্পিড CDN ডোমেন থেকে লোড হবে।

সেটিংসটি সেভ করা মাত্রই আপনার কোম্পানির সমস্ত আপলোড ক্লাউডফ্লেয়ার R2-তে সিঙ্ক হওয়া শুরু হয়ে যাবে!

---

## ৩. R2-এর জন্য প্রয়োজনীয় Cloudflare Bucket CORS সেটিংস
Cloudflare R2 বালতি (Bucket) এর জন্য **CORS Policy** অবশ্যই সচল থাকতে হবে যাতে আপনার ERP ওয়েবসাইট থেকে ইমেজগুলো নির্বিঘ্নে লোড হতে পারে। 

**Cloudflare dashboard -> R2 -> select your bucket -> Settings -> CORS Policy**-এ গিয়ে নিচের JSON-টি বসিয়ে দিন:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "POST", "PUT", "HEAD"],
    "AllowedOrigins": ["https://app.dynime.com", "http://localhost:8000"],
    "ExposeHeaders": []
  }
]
```

---
*Created by Antigravity on 2026-07-16.*
