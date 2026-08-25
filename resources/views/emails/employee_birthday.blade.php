<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Happy Birthday from Dynime LLC!</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@600;700;800;900&display=swap');
        
        body {
            margin: 0;
            padding: 0;
            background-color: #05070b;
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #e2e8f0;
            -webkit-font-smoothing: antialiased;
        }

        .email-wrapper {
            width: 100%;
            background-color: #05070b;
            padding: 40px 10px;
        }

        .email-card {
            max-width: 580px;
            margin: 0 auto;
            background: #111827;
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid #1f2937;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
        }

        /* Solid Color Hero Banner (No Gradients) */
        .hero-banner {
            background-color: #4f46e5;
            padding: 42px 30px 36px;
            text-align: center;
        }

        .hero-banner-img {
            width: 90px;
            height: 90px;
            margin: 0 auto 16px;
            display: block;
            border-radius: 50%;
            padding: 6px;
            background-color: rgba(255, 255, 255, 0.2);
        }

        .hero-title {
            font-family: 'Outfit', sans-serif;
            font-size: 32px;
            font-weight: 900;
            color: #ffffff;
            margin: 0;
            letter-spacing: -0.5px;
            text-transform: uppercase;
        }

        .hero-subtitle {
            font-size: 14px;
            color: #e0e7ff;
            margin-top: 8px;
            font-weight: 600;
            letter-spacing: 0.3px;
        }

        .card-body {
            padding: 36px 32px 30px;
            background-color: #111827;
        }

        /* Personal Wish Header */
        .recipient-box {
            text-align: center;
            margin-bottom: 26px;
        }

        .recipient-name {
            font-family: 'Outfit', sans-serif;
            font-size: 26px;
            font-weight: 800;
            color: #ffffff;
            margin: 0 0 6px;
        }

        .recipient-badge {
            display: inline-block;
            padding: 4px 14px;
            background-color: #1e1b4b;
            border: 1px solid #4338ca;
            color: #a5b4fc;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }

        .wish-paragraph {
            background-color: #1f2937;
            border-radius: 12px;
            padding: 22px 24px;
            border: 1px solid #374151;
            margin-bottom: 26px;
            line-height: 1.7;
            font-size: 15px;
            color: #d1d5db;
        }

        /* Solid Color Birthday Gift Box */
        .gift-card {
            background-color: #1e1b4b;
            border: 1px solid #4f46e5;
            border-radius: 14px;
            padding: 26px 22px;
            text-align: center;
            margin-bottom: 26px;
        }

        .gift-tag {
            display: inline-block;
            background-color: #4f46e5;
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            padding: 4px 12px;
            border-radius: 8px;
            margin-bottom: 12px;
        }

        .gift-title {
            font-family: 'Outfit', sans-serif;
            font-size: 22px;
            font-weight: 800;
            color: #ffffff;
            margin: 0 0 10px;
        }

        .gift-desc {
            font-size: 14px;
            color: #e0e7ff;
            line-height: 1.6;
            margin: 0;
        }

        /* Perks Table */
        .perks-table {
            width: 100%;
            margin-bottom: 26px;
            border-spacing: 10px 0;
        }

        .perk-card {
            background-color: #1f2937;
            border: 1px solid #374151;
            border-radius: 12px;
            padding: 16px 10px;
            text-align: center;
        }

        .perk-icon-img {
            width: 38px;
            height: 38px;
            margin-bottom: 8px;
        }

        .perk-text {
            font-size: 12px;
            font-weight: 700;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: block;
        }

        .closing-text {
            text-align: center;
            font-size: 14px;
            font-weight: 600;
            color: #a5b4fc;
            line-height: 1.6;
            margin-bottom: 6px;
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-card">
            
            <!-- Solid Color Hero Banner -->
            <div class="hero-banner">
                <img src="https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif" alt="Birthday Cake" class="hero-banner-img">
                <h1 class="hero-title">Happy Birthday!</h1>
                <div class="hero-subtitle">Wishing You a Wonderful Year of Success & Happiness</div>
            </div>

            <!-- Main Content -->
            <div class="card-body">
                
                <!-- Recipient Header -->
                <div class="recipient-box">
                    <h2 class="recipient-name">Dear {{ $employeeName }},</h2>
                    @if($designationName || $departmentName)
                        <span class="recipient-badge">
                            {{ $designationName }} {{ $departmentName ? '• ' . $departmentName : '' }}
                        </span>
                    @endif
                </div>

                <!-- Personal Wish Message -->
                <div class="wish-paragraph">
                    <p style="margin-top: 0;">
                        On this special occasion of your birthday, the leadership team and your entire family at <strong>Dynime LLC</strong> send you our warmest greetings and heartfelt appreciation!
                    </p>
                    <p style="margin-bottom: 0;">
                        Your talent, energy, and dedication bring tremendous value to our team every day. We hope your special day is filled with laughter, joy, and wonderful memories.
                    </p>
                </div>

                <!-- Birthday Gift Card -->
                <div class="gift-card">
                    <span class="gift-tag">SPECIAL BIRTHDAY GIFT</span>
                    <h3 class="gift-title">Your Paid Birthday Off Gift 🎁</h3>
                    <p class="gift-desc">
                        As a token of our appreciation for everything you do, please accept <strong>today as your Paid Birthday Holiday Gift</strong>! Unwind, celebrate, and enjoy quality time with your family and loved ones.
                    </p>
                </div>

                <!-- Perks Grid -->
                <table class="perks-table">
                    <tr>
                        <td class="perk-card" width="33%">
                            <img src="https://img.icons8.com/isometric/100/gift.png" alt="Gift" class="perk-icon-img">
                            <span class="perk-text">Celebration</span>
                        </td>
                        <td class="perk-card" width="33%">
                            <img src="https://img.icons8.com/isometric/100/birthday-cake.png" alt="Cake" class="perk-icon-img">
                            <span class="perk-text">Joy & Treats</span>
                        </td>
                        <td class="perk-card" width="33%">
                            <img src="https://img.icons8.com/isometric/100/star.png" alt="Star" class="perk-icon-img">
                            <span class="perk-text">Paid Day Off</span>
                        </td>
                    </tr>
                </table>

                <div class="closing-text">
                    May the year ahead bring you great health, happiness, and extraordinary success!
                </div>

            </div>

            <!-- Global Dynime LLC Email Footer -->
            @include('emails.partials.footer')

        </div>
    </div>
</body>
</html>
