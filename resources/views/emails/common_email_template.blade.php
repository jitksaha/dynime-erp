<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name') }}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px 10px;
            background-color: #f8fafc;
            -webkit-font-smoothing: antialiased;
        }
        .container {
            background-color: #ffffff; 
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
            overflow: hidden;
        }
        .header {
            text-align: center;
            padding: 30px 20px;
            border-bottom: 1px solid #f1f5f9;
            background-color: #ffffff;
        }
        .header img {
            display: block;
            margin: 0 auto;
            max-width: 150px;
            height: auto;
        }
        .content {
            padding: 36px 30px;
            font-size: 15px;
            color: #334155;
        }
        a {
            color: #2563eb;
            text-decoration: underline;
        }
        a:hover {
            color: #1d4ed8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://cdn.dynime.com/Dynime%20Logo/LOGO%20PNG/logo%20PNG/logo.png" alt="Dynime" width="150">
        </div>

        <div class="content">
            {!! $content !!}
        </div>

        @include('emails.partials.footer')
    </div>
</body>
</html>
