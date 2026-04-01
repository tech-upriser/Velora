import VeloraLogo from "../components/VeloraLogo";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const FontLink = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=Lora:ital,wght@0,400;0,600;1,400;1,600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --nav-h: 68px;
      --accent: #E8341A;
      --accent-hover: #c9270e;
      --gold: #F5A623;
      --white: #FFFFFF;
      --black: #0A0A0A;
    }

    html, body {
      margin: 0; padding: 0;
      width: 100%; height: 100%;
      overflow-x: hidden; overflow-y: auto;
    }
    #root { width: 100%; margin: 0; padding: 0; }

    body {
      font-family: 'Sora', sans-serif;
      background: var(--black);
      color: var(--white);
    }

    .velora-nav {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: var(--nav-h);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 5%; z-index: 1000;
      transition: background 0.4s ease, backdrop-filter 0.4s ease, box-shadow 0.4s ease;
    }
    .velora-nav.scrolled {
      background: rgba(8,8,8,0.88);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      box-shadow: 0 1px 0 rgba(255,255,255,0.06);
    }
    .nav-logo {
      display: flex; align-items: center; gap: 8px;
      cursor: pointer; text-decoration: none;
    }
    .nav-logo-icon {
      width: 32px; height: 32px;
      background: linear-gradient(135deg, var(--accent), var(--gold));
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px;
    }
    .nav-logo-text {
      font-size: 22px; font-weight: 800;
      color: var(--white); letter-spacing: -0.5px;
    }
    .nav-links {
      display: flex; align-items: center; gap: 28px;
      position: absolute; left: 50%; transform: translateX(-50%);
    }
    .nav-link {
      color: rgba(255,255,255,0.82);
      text-decoration: none;
      font-size: 14px; font-weight: 500;
      letter-spacing: 0.2px; transition: color 0.2s;
      position: relative;
    }
    .nav-link::after {
      content: ''; position: absolute;
      bottom: -3px; left: 0;
      width: 0; height: 1.5px;
      background: var(--gold);
      transition: width 0.25s ease;
    }
    .nav-link:hover { color: #fff; }
    .nav-link:hover::after { width: 100%; }
    .nav-actions { display: flex; align-items: center; gap: 12px; }

    .btn-signin {
      display: flex; align-items: center; gap: 7px;
      padding: 9px 20px; border-radius: 50px;
      border: 1.5px solid rgba(255,255,255,0.35);
      background: rgba(255,255,255,0.07);
      color: var(--white);
      font-family: 'Sora', sans-serif;
      font-size: 13.5px; font-weight: 600;
      cursor: pointer; backdrop-filter: blur(6px);
      transition: all 0.22s ease;
    }
    .btn-signin:hover {
      background: rgba(255,255,255,0.14);
      border-color: rgba(255,255,255,0.55);
    }
    .btn-plan {
      display: flex; align-items: center; gap: 7px;
      padding: 9px 20px; border-radius: 50px;
      border: none;
      background: linear-gradient(135deg, var(--gold), #e09820);
      color: #000;
      font-family: 'Sora', sans-serif;
      font-size: 13.5px; font-weight: 700;
      cursor: pointer;
      transition: all 0.22s ease;
      box-shadow: 0 4px 16px rgba(245,166,35,0.35);
    }
    .btn-plan:hover { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(245,166,35,0.45); }

    .btn-emergency {
      display: flex; align-items: center; gap: 8px;
      padding: 9px 20px; border-radius: 50px; border: none;
      background: var(--accent); color: var(--white);
      font-family: 'Sora', sans-serif;
      font-size: 13.5px; font-weight: 700;
      cursor: pointer; letter-spacing: 0.1px;
      transition: background 0.2s, transform 0.15s;
      box-shadow: 0 4px 18px rgba(232,52,26,0.38);
    }
    .btn-emergency:hover { background: var(--accent-hover); transform: translateY(-1px); }
    .btn-emergency .pulse-dot {
      width: 8px; height: 8px; border-radius: 50%; background: #fff;
      animation: pulse-ring 1.4s ease infinite;
    }
    @keyframes pulse-ring {
      0%   { box-shadow: 0 0 0 0 rgba(255,255,255,0.7); }
      70%  { box-shadow: 0 0 0 6px rgba(255,255,255,0); }
      100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
    }

    .avatar-wrap { position: relative; }
    .avatar-trigger {
      display: flex; align-items: center; gap: 9px;
      cursor: pointer; padding: 5px 14px 5px 5px;
      border-radius: 50px;
      border: 1.5px solid rgba(255,255,255,0.2);
      background: rgba(255,255,255,0.07);
      backdrop-filter: blur(6px); transition: background 0.2s;
    }
    .avatar-trigger:hover { background: rgba(255,255,255,0.12); }
    .avatar-img {
      width: 28px; height: 28px; border-radius: 50%;
      object-fit: cover; border: 1.5px solid var(--gold);
    }
    .avatar-name { color: #fff; font-size: 13.5px; font-weight: 600; }
    .avatar-chevron {
      width: 14px; height: 14px;
      color: rgba(255,255,255,0.6); transition: transform 0.2s;
    }
    .avatar-chevron.open { transform: rotate(180deg); }

    .dropdown {
      position: absolute; top: calc(100% + 10px); right: 0;
      background: #1a1a1a;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px; padding: 8px; min-width: 170px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.55);
      animation: dropIn 0.18s ease; z-index: 999;
    }
    @keyframes dropIn {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .dropdown-item {
      display: flex; align-items: center; gap: 9px;
      width: 100%; padding: 10px 14px;
      border: none; background: none;
      color: rgba(255,255,255,0.82);
      font-family: 'Sora', sans-serif;
      font-size: 13.5px; font-weight: 500;
      cursor: pointer; border-radius: 8px;
      transition: background 0.18s; text-align: left;
    }
    .dropdown-item:hover { background: rgba(255,255,255,0.08); color: #fff; }
    .dropdown-item.danger { color: #ff5a5a; }
    .dropdown-item.danger:hover { background: rgba(255,90,90,0.1); }

    .hero {
      position: relative; width: 100%;
      height: 100dvh; min-height: 100vh;
      display: grid; place-items: center;
      overflow: hidden; background: #000;
      margin: 0; padding: 0;
    }
    .hero-slideshow {
      position: absolute; inset: 0;
      width: 100%; height: 100%; z-index: 0;
    }
    .slide {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      background-size: cover; background-position: center;
      background-repeat: no-repeat;
      opacity: 0; transition: opacity 1.6s ease-in-out;
      transform: scale(1); will-change: transform, opacity;
    }
    .slide.active {
      opacity: 1;
      animation: heroZoomIn 8s ease-in-out forwards;
    }
    @keyframes heroZoomIn {
      0%   { transform: scale(1); }
      100% { transform: scale(1.08); }
    }
    .hero-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(
        to bottom,
        rgba(0,0,0,0.25) 0%,
        rgba(0,0,0,0.35) 40%,
        rgba(0,0,0,0.72) 100%
      );
      z-index: 1;
    }
    .hero-content {
      position: relative; z-index: 2;
      text-align: center; padding: 0 20px;
      width: 100%; max-width: 700px;
      animation: fadeUp 0.9s cubic-bezier(0.22,1,0.36,1) both;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(30px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .hero-title {
      font-family: 'Lora', serif;
      font-size: clamp(3rem, 7vw, 5.5rem);
      font-weight: 900; color: var(--white);
      letter-spacing: -2px; line-height: 1.05;
      margin-bottom: 14px;
      text-shadow: 0 4px 30px rgba(0,0,0,0.4);
    }
    .hero-tagline {
      font-family: 'Lora', serif; font-style: italic;
      font-size: clamp(1.1rem, 2vw, 1.6rem);
      color: rgba(255,255,255,0.65);
      margin-bottom: 38px; letter-spacing: 0.5px; line-height: 1.4;
    }
    .hero-cta-row {
      display: flex; align-items: center; justify-content: center;
      gap: 14px; flex-wrap: wrap; margin-bottom: 32px;
    }
    .hero-cta-plan {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 14px 32px; border-radius: 50px; border: none;
      background: linear-gradient(135deg, var(--gold), #e09820);
      color: #000; font-family: 'Sora', sans-serif;
      font-size: 15px; font-weight: 800;
      cursor: pointer; letter-spacing: 0.2px;
      box-shadow: 0 6px 28px rgba(245,166,35,0.45);
      transition: all 0.22s ease;
    }
    .hero-cta-plan:hover { transform: translateY(-2px); box-shadow: 0 10px 36px rgba(245,166,35,0.55); }
    .hero-cta-explore {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 14px 28px; border-radius: 50px;
      border: 1.5px solid rgba(255,255,255,0.35);
      background: rgba(255,255,255,0.08);
      color: #fff; font-family: 'Sora', sans-serif;
      font-size: 15px; font-weight: 600;
      cursor: pointer; backdrop-filter: blur(6px);
      transition: all 0.22s ease;
    }
    .hero-cta-explore:hover {
      background: rgba(255,255,255,0.15);
      border-color: rgba(255,255,255,0.6);
    }

    .search-bar {
      display: flex; align-items: center;
      background: rgba(255,255,255,0.93);
      backdrop-filter: blur(10px);
      border-radius: 50px; overflow: hidden;
      max-width: 540px; margin: 0 auto;
      box-shadow: 0 8px 40px rgba(0,0,0,0.35);
      border: 1px solid rgba(255,255,255,0.6);
      transition: box-shadow 0.25s;
    }
    .search-bar:focus-within {
      box-shadow: 0 8px 50px rgba(0,0,0,0.45), 0 0 0 3px rgba(245,166,35,0.35);
    }
    .search-icon-wrap {
      padding: 0 16px 0 20px;
      display: flex; align-items: center; color: #888;
    }
    .search-input {
      flex: 1; padding: 16px 0;
      border: none; outline: none; background: transparent;
      font-family: 'Sora', sans-serif;
      font-size: 15px; font-weight: 500; color: #1a1a1a;
    }
    .search-input::placeholder { color: #999; font-weight: 400; }
    .search-btn {
      padding: 11px 24px; margin: 6px;
      border-radius: 50px; border: none;
      background: var(--black); color: var(--white);
      font-family: 'Sora', sans-serif;
      font-size: 14px; font-weight: 700;
      cursor: pointer; letter-spacing: 0.3px;
      transition: background 0.2s, transform 0.15s;
    }
    .search-btn:hover { background: #222; transform: scale(1.03); }

    .login-nudge {
      position: fixed; top: 88px; left: 50%;
      transform: translateX(-50%);
      background: #1a1a1a;
      border: 1px solid rgba(245,166,35,0.4);
      border-radius: 14px; padding: 14px 22px;
      display: flex; align-items: center; gap: 14px;
      z-index: 2000;
      box-shadow: 0 12px 40px rgba(0,0,0,0.5);
      animation: nudgeIn 0.3s cubic-bezier(0.22,1,0.36,1);
      white-space: nowrap;
    }
    @keyframes nudgeIn {
      from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    .nudge-text { font-size: 13.5px; color: rgba(255,255,255,0.85); font-weight: 500; }
    .nudge-btn {
      padding: 7px 18px; border-radius: 50px; border: none;
      background: var(--accent); color: #fff;
      font-family: 'Sora', sans-serif;
      font-size: 13px; font-weight: 700;
      cursor: pointer; transition: background 0.2s;
    }
    .nudge-btn:hover { background: var(--accent-hover); }
    .nudge-close {
      background: none; border: none;
      color: rgba(255,255,255,0.4);
      cursor: pointer; font-size: 16px; padding: 0;
      transition: color 0.2s;
    }
    .nudge-close:hover { color: #fff; }

    .destinations-section {
      padding: 100px 5%; background: #F7F5F0;
    }
    .section-eyebrow {
      text-align: center; font-size: 11.5px; font-weight: 700;
      letter-spacing: 3px; text-transform: uppercase;
      color: var(--accent); margin-bottom: 14px;
    }
    .section-title {
      text-align: center;
      font-size: clamp(1.8rem, 3.5vw, 2.8rem);
      font-weight: 800; color: #0D0D0D;
      letter-spacing: -1px; margin-bottom: 10px;
    }
    .section-desc {
      text-align: center; color: #888; font-size: 15.5px;
      max-width: 480px; margin: 0 auto 60px; line-height: 1.65;
    }
    .dest-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
      gap: 26px;
    }
    .dest-card {
      border-radius: 20px; overflow: hidden;
      background: #fff;
      box-shadow: 0 2px 16px rgba(0,0,0,0.07);
      cursor: pointer;
      transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease;
    }
    .dest-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 50px rgba(0,0,0,0.14);
    }
    .dest-card:hover .dest-img { transform: scale(1.06); }
    .dest-img-wrap { height: 210px; overflow: hidden; position: relative; }
    .dest-img {
      width: 100%; height: 100%; object-fit: cover;
      transition: transform 0.5s cubic-bezier(0.22,1,0.36,1);
    }
    .dest-tag {
      position: absolute; top: 14px; left: 14px;
      background: rgba(0,0,0,0.5); backdrop-filter: blur(8px);
      color: #fff; font-size: 11px; font-weight: 700;
      letter-spacing: 1.5px; text-transform: uppercase;
      padding: 5px 11px; border-radius: 50px;
    }
    .dest-body { padding: 20px 22px 24px; }
    .dest-name {
      font-size: 18px; font-weight: 800;
      color: #0D0D0D; letter-spacing: -0.4px; margin-bottom: 6px;
    }
    .dest-desc { font-size: 14px; color: #888; line-height: 1.55; margin-bottom: 16px; }
    .dest-footer { display: flex; align-items: center; justify-content: space-between; }
    .dest-explore {
      font-size: 13px; font-weight: 700; color: var(--accent);
      letter-spacing: 0.3px; display: flex; align-items: center; gap: 5px;
    }
    .dest-arrow { display: inline-block; transition: transform 0.2s; }
    .dest-card:hover .dest-arrow { transform: translateX(4px); }
    .dest-rating {
      display: flex; align-items: center; gap: 4px;
      font-size: 12.5px; font-weight: 600; color: #555;
    }
    .star { color: var(--gold); font-size: 13px; }

    .em-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.78);
      backdrop-filter: blur(10px);
      z-index: 3000;
      display: flex; align-items: center; justify-content: center;
      padding: 20px; animation: backdropIn 0.25s ease;
    }
    @keyframes backdropIn { from { opacity: 0; } to { opacity: 1; } }
    .em-modal {
      background: #111;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 24px; padding: 32px;
      width: 100%; max-width: 520px;
      box-shadow: 0 40px 100px rgba(0,0,0,0.7);
      animation: modalIn 0.3s cubic-bezier(0.22,1,0.36,1);
    }
    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.92) translateY(20px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    .em-header {
      display: flex; align-items: center;
      justify-content: space-between; margin-bottom: 8px;
    }
    .em-title-wrap { display: flex; align-items: center; gap: 10px; }
    .em-icon-badge {
      width: 40px; height: 40px;
      background: linear-gradient(135deg, #E8341A, #ff6b47);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
    }
    .em-title { font-size: 20px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
    .em-close {
      width: 32px; height: 32px; border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.7); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; transition: all 0.2s;
    }
    .em-close:hover { background: rgba(255,255,255,0.12); color: #fff; }
    .em-location-bar {
      display: flex; align-items: center; gap: 8px;
      background: rgba(245,166,35,0.1);
      border: 1px solid rgba(245,166,35,0.25);
      border-radius: 10px; padding: 10px 14px;
      margin-bottom: 24px; margin-top: 14px;
    }
    .em-location-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--gold); flex-shrink: 0;
      animation: pulse-ring 1.4s ease infinite;
    }
    .em-location-text { font-size: 12.5px; color: rgba(255,255,255,0.65); flex: 1; }
    .em-location-text strong { color: var(--gold); font-weight: 700; }
    .em-cards { display: flex; flex-direction: column; gap: 12px; }
    .em-card {
      display: flex; align-items: center; gap: 16px;
      background: #1a1a1a;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 16px; padding: 16px 18px;
      transition: border-color 0.2s, background 0.2s;
    }
    .em-card:hover { background: #222; border-color: rgba(255,255,255,0.14); }
    .em-card-icon {
      width: 48px; height: 48px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; flex-shrink: 0;
    }
    .em-card-icon.police  { background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.25); }
    .em-card-icon.hospital{ background: rgba(34,197,94,0.12);  border: 1px solid rgba(34,197,94,0.22); }
    .em-card-icon.fire    { background: rgba(249,115,22,0.13); border: 1px solid rgba(249,115,22,0.25); }
    .em-card-info { flex: 1; min-width: 0; }
    .em-card-name {
      font-size: 14px; font-weight: 700; color: #fff;
      letter-spacing: -0.2px; margin-bottom: 2px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .em-card-address {
      font-size: 12px; color: rgba(255,255,255,0.45);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .em-card-dist { font-size: 11px; color: var(--gold); font-weight: 600; margin-top: 3px; }
    .em-card-actions { display: flex; gap: 8px; flex-shrink: 0; }
    .em-action-btn {
      width: 36px; height: 36px; border-radius: 50%; border: none;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: transform 0.15s, opacity 0.2s; font-size: 15px;
    }
    .em-action-btn:hover { transform: scale(1.12); opacity: 0.85; }
    .em-action-btn.call { background: #22c55e; color: #fff; }
    .em-action-btn.map  { background: #3b82f6; color: #fff; }
    .em-loading { text-align: center; padding: 30px 0; color: rgba(255,255,255,0.5); font-size: 14px; }
    .em-spinner {
      width: 36px; height: 36px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 14px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .cookie-banner {
      position: fixed; bottom: 0; left: 0; right: 0;
      background: #0D0D0D;
      border-top: 1px solid rgba(255,255,255,0.08);
      padding: 13px 5%;
      display: flex; align-items: center;
      justify-content: space-between;
      gap: 16px; z-index: 2000; flex-wrap: wrap;
    }
    .cookie-text {
      font-size: 12.5px; color: rgba(255,255,255,0.55);
      line-height: 1.5; flex: 1; min-width: 220px;
    }
    .cookie-link { color: var(--gold); text-decoration: underline; cursor: pointer; }
    .cookie-actions { display: flex; gap: 10px; flex-shrink: 0; }
    .cookie-btn {
      padding: 8px 18px; border-radius: 8px;
      font-family: 'Sora', sans-serif;
      font-size: 12.5px; font-weight: 600;
      cursor: pointer; transition: all 0.2s;
    }
    .cookie-btn.reject {
      background: transparent;
      border: 1px solid rgba(255,255,255,0.18);
      color: rgba(255,255,255,0.65);
    }
    .cookie-btn.reject:hover { border-color: rgba(255,255,255,0.4); color: #fff; }
    .cookie-btn.accept {
      background: var(--accent);
      border: 1px solid var(--accent); color: #fff;
    }
    .cookie-btn.accept:hover { background: var(--accent-hover); }
  `}</style>
);

const bgImages = [
  "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1800&q=85",
  "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=1800&q=85",
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1800&q=85",
  "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1800&q=85",
];

const destinations = [
  { name: "Patna",     tag: "Heritage",  rating: "4.2", desc: "Ancient capital on the Ganges rich with history and cultural roots",         img: "https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?w=600" },
  { name: "Hyderabad", tag: "Culture",   rating: "4.6", desc: "City of Nizams known for biryani, Charminar & rich heritage",                img: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600" },
  { name: "Delhi",     tag: "Capital",   rating: "4.7", desc: "A vibrant mix of Mughal history, street food & modern energy",               img: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600" },
  { name: "Jaipur",    tag: "Royal",     rating: "4.8", desc: "Pink City filled with palaces, forts & regal Rajasthani charm",              img: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600" },
  { name: "Goa",       tag: "Beach",     rating: "4.8", desc: "Golden beaches, vibrant nightlife & Portuguese heritage vibes",               img: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600" },
  { name: "Manali",    tag: "Mountains", rating: "4.7", desc: "Snow-covered peaks, pine forests & peaceful escapes",                         img: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600" },
  { name: "Varanasi",  tag: "Spiritual", rating: "4.8", desc: "Sacred ghats on the Ganges echoing rituals, faith & ancient life",           img: "https://images.unsplash.com/photo-1561361058-c24cecae35ca?w=600" },
  { name: "Bangalore", tag: "Urban",     rating: "4.6", desc: "India's tech hub blending modern life with gardens & cafes",                  img: "https://images.unsplash.com/photo-1580294647332-8a399cd9ed45?w=600" },
];

/* ─── Emergency Modal ─── */
function EmergencyModal({ onClose }) {
  const [loading, setLoading]   = useState(true);
  const [location, setLocation] = useState(null);
  const [services, setServices] = useState([]);

  const fetchNearbyServices = (lat, lng) => {
    setServices([
      { type: "police",   icon: "🚔", name: "Nearest Police Station", address: "Dial 100 for exact location", phone: "100", distance: "Nearby", mapsUrl: `https://www.google.com/maps/search/police+station/@${lat},${lng},14z` },
      { type: "hospital", icon: "🏥", name: "Nearest Hospital",        address: "Dial 108 for ambulance",      phone: "108", distance: "Nearby", mapsUrl: `https://www.google.com/maps/search/hospital/@${lat},${lng},14z` },
      { type: "fire",     icon: "🚒", name: "Fire Station",            address: "Dial 101 for fire emergency", phone: "101", distance: "Nearby", mapsUrl: `https://www.google.com/maps/search/fire+station/@${lat},${lng},14z` },
    ]);
    setLoading(false);
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); fetchNearbyServices(pos.coords.latitude, pos.coords.longitude); },
        ()    => { setLocation({ lat: 20.5937, lng: 78.9629, fallback: true }); fetchNearbyServices(20.5937, 78.9629); },
        { timeout: 8000 }
      );
    } else {
      fetchNearbyServices(20.5937, 78.9629);
    }
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="em-backdrop" onClick={onClose}>
      <div className="em-modal" onClick={e => e.stopPropagation()}>
        <div className="em-header">
          <div className="em-title-wrap">
            <div className="em-icon-badge">🆘</div>
            <span className="em-title">Emergency Help</span>
          </div>
          <button className="em-close" onClick={onClose}>✕</button>
        </div>
        <div className="em-location-bar">
          <div className="em-location-dot" />
          <span className="em-location-text">
            {location ? location.fallback
              ? <>Showing national emergency numbers</>
              : <>Location detected — <strong>tap Map</strong> to find nearest services</>
              : "Detecting your location…"}
          </span>
        </div>
        {loading ? (
          <div className="em-loading"><div className="em-spinner" />Finding nearby emergency services…</div>
        ) : (
          <div className="em-cards">
            {services.map((s, i) => (
              <div key={i} className="em-card">
                <div className={`em-card-icon ${s.type}`}>{s.icon}</div>
                <div className="em-card-info">
                  <div className="em-card-name">{s.name}</div>
                  <div className="em-card-address">{s.address}</div>
                  <div className="em-card-dist">📍 {s.distance}</div>
                </div>
                <div className="em-card-actions">
                  <button className="em-action-btn call" onClick={() => window.open(`tel:${s.phone}`, "_self")}>📞</button>
                  <button className="em-action-btn map"  onClick={() => window.open(s.mapsUrl, "_blank", "noopener,noreferrer")}>🗺️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Home Component ─── */
export default function Home() {
  const navigate = useNavigate();
  const [user, setUser]                       = useState(null);
  const [dropdownOpen, setDropdownOpen]       = useState(false);
  const [scrolled, setScrolled]               = useState(false);
  const [cookieDismissed, setCookieDismissed] = useState(false);
  const [search, setSearch]                   = useState("");
  const [currentBg, setCurrentBg]             = useState(0);
  const [emergencyOpen, setEmergencyOpen]     = useState(false);
  const [showNudge, setShowNudge]             = useState(false);

  // ── Slideshow ──
  useEffect(() => {
    const timer = setInterval(() => setCurrentBg(prev => (prev + 1) % bgImages.length), 8000);
    return () => clearInterval(timer);
  }, []);

  // ── Scroll detection ──
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Load user + verify token with backend ──
  useEffect(() => {
    const stored = localStorage.getItem("velora_user");
    const token  = localStorage.getItem("velora_token");

    if (stored) {
      try { setUser(JSON.parse(stored)); }
      catch (e) { console.error(e); }
    }

    // Verify JWT token with backend — auto logout if expired
    if (token) {
      fetch(`${BASE_URL}/verify-token`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) {
            // Token expired or invalid
            localStorage.removeItem("velora_user");
            localStorage.removeItem("velora_token");
            setUser(null);
          }
        })
        .catch(() => {
          // Backend unreachable — keep user logged in locally
          console.warn("Backend unreachable, keeping local session");
        });
    }
  }, []);

  // ── Close dropdown on outside click ──
  useEffect(() => {
    const handler = () => setDropdownOpen(false);
    if (dropdownOpen) document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [dropdownOpen]);

  // ── Auto-hide nudge ──
  useEffect(() => {
    if (showNudge) {
      const t = setTimeout(() => setShowNudge(false), 4000);
      return () => clearTimeout(t);
    }
  }, [showNudge]);

  const handleLogout = async () => {
    try { await signOut(auth); } catch (e) { /* Firebase not used for this user */ }
    localStorage.removeItem("velora_user");
    localStorage.removeItem("velora_token");
    setUser(null);
    setDropdownOpen(false);
    navigate("/");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    if (!user) { setShowNudge(true); return; }
    document.getElementById("destinations")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDestinationClick = () => {
    if (!user) { setShowNudge(true); return; }
    navigate("/trips");
  };

  return (
    <>
      <FontLink />

      {emergencyOpen && <EmergencyModal onClose={() => setEmergencyOpen(false)} />}

      {showNudge && (
        <div className="login-nudge">
          <span className="nudge-text">🔒 Please sign in to explore destinations</span>
          <button className="nudge-btn" onClick={() => navigate("/login")}>Sign In</button>
          <button className="nudge-close" onClick={() => setShowNudge(false)}>✕</button>
        </div>
      )}

      {/* ── Navbar ── */}
      <nav className={`velora-nav${scrolled ? " scrolled" : ""}`}>
        <a className="nav-logo" href="/" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
          <VeloraLogo size={32} textColor="#fff" />
        </a>

        <div className="nav-links">
          <a href="#destinations" className="nav-link">Destinations</a>
          <a href="#experiences"  className="nav-link">Experiences</a>
          <a href="#about"        className="nav-link">About</a>
          {user && <span className="nav-link" style={{ cursor: "pointer" }} onClick={() => navigate("/trips")}>My Trips</span>}
        </div>

        <div className="nav-actions">
          {user ? (
            <>
              <button className="btn-plan" onClick={() => navigate("/trips")}>🗺️ Plan a Trip</button>
              <div className="avatar-wrap" onClick={e => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}>
                <div className="avatar-trigger">
                  <img
                    src={user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "U")}&background=E8341A&color=fff`}
                    alt="profile" className="avatar-img"
                  />
                  <span className="avatar-name">{user.name?.split(" ")[0] || "User"}</span>
                  <svg className={`avatar-chevron${dropdownOpen ? " open" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
                {dropdownOpen && (
                  <div className="dropdown" onClick={e => e.stopPropagation()}>
                    <button className="dropdown-item" onClick={() => { setDropdownOpen(false); navigate("/profile"); }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                      Profile
                    </button>
                    <button className="dropdown-item" onClick={() => { setDropdownOpen(false); navigate("/trips"); }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-4M12 12v9M8 17l4 4 4-4"/></svg>
                      My Trips
                    </button>
                    <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", margin: "6px 0" }} />
                    <button className="dropdown-item danger" onClick={handleLogout}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button className="btn-signin" onClick={() => navigate("/login")}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/>
              </svg>
              Sign In
            </button>
          )}
          <button className="btn-emergency" onClick={() => setEmergencyOpen(true)}>
            <span className="pulse-dot" /> Emergency
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-slideshow">
          {bgImages.map((img, index) => (
            <div key={img} className={`slide${index === currentBg ? " active" : ""}`}
              style={{ backgroundImage: `url(${img})` }} />
          ))}
        </div>
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="hero-title">Discover India</h1>
          <p className="hero-tagline">Redefining the way you roam</p>
          {user ? (
            <div className="hero-cta-row">
              <button className="hero-cta-plan" onClick={() => navigate("/trips")}>🗺️ Plan a Trip</button>
              <button className="hero-cta-explore" onClick={() => document.getElementById("destinations")?.scrollIntoView({ behavior: "smooth" })}>
                Explore Destinations ↓
              </button>
            </div>
          ) : (
            <form className="search-bar" onSubmit={handleSearch}>
              <div className="search-icon-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
              </div>
              <input className="search-input" placeholder="Search to find your destinations…" value={search} onChange={e => setSearch(e.target.value)} />
              <button type="submit" className="search-btn">Search</button>
            </form>
          )}
        </div>
      </section>

      {/* ── Destinations ── */}
      <section id="destinations" className="destinations-section">
        <p className="section-eyebrow">✦ Curated Escapes</p>
        <h2 className="section-title">Popular Destinations</h2>
        <p className="section-desc">From misty mountain towns to tropical island paradises — find your next chapter.</p>
        <div className="dest-grid">
          {destinations.map(place => (
            <div key={place.name} className="dest-card" onClick={handleDestinationClick}>
              <div className="dest-img-wrap">
                <img src={place.img} alt={place.name} className="dest-img" loading="lazy" />
                <span className="dest-tag">{place.tag}</span>
              </div>
              <div className="dest-body">
                <div className="dest-name">{place.name}</div>
                <div className="dest-desc">{place.desc}</div>
                <div className="dest-footer">
                  <span className="dest-explore">Explore <span className="dest-arrow">→</span></span>
                  <span className="dest-rating"><span className="star">★</span> {place.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Experiences ── */}
      <section id="experiences" style={{
        padding: "80px 5%",
        background: "#111",
        textAlign: "center"
      }}>
        <p className="section-eyebrow">✦ What We Offer</p>
        <h2 className="section-title">Travel Experiences</h2>
        <p className="section-desc">Everything you need for a seamless journey — all in one place.</p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "24px",
          maxWidth: "1100px",
          margin: "48px auto 0"
        }}>
          {[
            { icon: "🗺️", title: "Route Optimization", desc: "Plan the shortest path across multiple tourist spots using our smart TSP algorithm — save time, see more." },
            { icon: "📍", title: "Place Discovery", desc: "Explore top-rated attractions, restaurants, and hidden gems in any city across India, powered by Google Places." },
            { icon: "🚨", title: "SOS Emergency", desc: "One-tap emergency alerts with your live location. Nearby hospitals, police and fire stations always at hand." },
            { icon: "📊", title: "Travel Analytics", desc: "Track your trips, cities explored and distance covered. Unlock milestones as you roam further." },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              padding: "32px 24px",
              textAlign: "left",
              transition: "transform 0.2s, border-color 0.2s",
              cursor: "default"
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "rgba(245,166,35,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)";  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
            >
              <div style={{ fontSize: "32px", marginBottom: "16px" }}>{icon}</div>
              <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#fff", marginBottom: "10px" }}>{title}</h3>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: 1.65 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" style={{
        padding: "80px 5%",
        background: "#0A0A0A",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        gap: "60px"
      }}>
        <div style={{ maxWidth: "480px" }}>
          <p className="section-eyebrow">✦ Our Story</p>
          <h2 className="section-title" style={{ textAlign: "left" }}>About Velora</h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.8, marginTop: "16px" }}>
            Velora was built by a team of five students who were tired of juggling five different apps
            just to plan a single trip. We set out to create one smart, beautiful companion that handles
            discovery, routing, safety and tracking — so you can focus on the journey, not the logistics.
          </p>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.8, marginTop: "14px" }}>
            Powered by Google Maps APIs, OpenWeatherMap and a custom TSP route optimizer, Velora
            brings together the best tools for modern travellers across India.
          </p>
          <div style={{ display: "flex", gap: "32px", marginTop: "36px", flexWrap: "wrap" }}>
            {[["5", "Team Members"], ["4", "APIs Integrated"], ["6", "Travel Milestones"]].map(([num, label]) => (
              <div key={label}>
                <div style={{ fontSize: "32px", fontWeight: 800, color: "#F5A623" }}>{num}</div>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "20px",
          padding: "32px",
          maxWidth: "340px",
          width: "100%"
        }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#F5A623", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "20px" }}>Our Team</p>
          {["Shreya Kumari", "E.V. Sai Chathurya", "Gunuganti Sanjitha", "A. Sai Poojitha", "P. Sindhu Priya"].map(name => (
            <div key={name} style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "10px 0",
              borderBottom: "1px solid rgba(255,255,255,0.06)"
            }}>
              <div style={{
                width: "34px", height: "34px", borderRadius: "50%",
                background: "linear-gradient(135deg, #E8341A, #F5A623)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "13px", fontWeight: 700, color: "#fff", flexShrink: 0
              }}>
                {name[0]}
              </div>
              <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)" }}>{name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Cookie Banner ── */}
      {!cookieDismissed && (
        <div className="cookie-banner">
          <p className="cookie-text">
            We use cookies for performance and personalization.{" "}
            <span className="cookie-link">Cookie settings</span>
          </p>
          <div className="cookie-actions">
            <button className="cookie-btn reject" onClick={() => setCookieDismissed(true)}>Do not allow</button>
            <button className="cookie-btn accept" onClick={() => setCookieDismissed(true)}>Allow all</button>
          </div>
        </div>
      )}
    </>
  );
}
