'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="py-20 bg-transparent border-t border-outline-variant/10">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-headline font-bold text-on-surface dark:text-white">
                HymyMom
              </span>
            </Link>
            <p className="text-on-surface-variant dark:text-slate-400 max-w-sm font-medium leading-relaxed">
              Elevating the clinical standard of postpartum recovery through intelligence and heart-centered design.
            </p>
            <div className="flex items-center gap-2 text-primary font-bold">
              <Heart className="w-5 h-5 fill-current" />
              <span>Built for caregivers, by caregivers.</span>
            </div>
          </div>
          
          <div className="space-y-6">
            <h4 className="text-sm font-black uppercase tracking-widest text-on-surface dark:text-white">Product</h4>
            <ul className="space-y-4">
              <li><Link href="#features" className="text-on-surface-variant hover:text-primary transition-colors">Features</Link></li>
              <li><Link href="#how-it-works" className="text-on-surface-variant hover:text-primary transition-colors">How it Works</Link></li>
              <li><Link href="#pricing" className="text-on-surface-variant hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link href="/register" className="text-on-surface-variant hover:text-primary transition-colors">Sign Up</Link></li>
            </ul>
          </div>
          
          <div className="space-y-6">
            <h4 className="text-sm font-black uppercase tracking-widest text-on-surface dark:text-white">Support</h4>
            <ul className="space-y-4">
              <li><Link href="#faq" className="text-on-surface-variant hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="/contact" className="text-on-surface-variant hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link href="/privacy" className="text-on-surface-variant hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-on-surface-variant hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-12 border-t border-outline-variant/10 flex flex-col md:flex-row justify-between items-center gap-6 text-sm font-medium text-slate-400">
          <p>© {new Date().getFullYear()} HymyMom. All rights reserved.</p>
          <div className="flex gap-8">
            <Link href="https://instagram.com/hymymom" target="_blank" className="hover:text-primary transition-colors">Instagram</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
