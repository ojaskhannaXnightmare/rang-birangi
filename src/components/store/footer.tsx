'use client'

import { Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'

export function Footer() {
  const setView = useUIStore((s) => s.setView)

  return (
    <footer className="mt-auto border-t border-border bg-card/30 backdrop-blur">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-luxe-gradient flex items-center justify-center border border-gold/30">
                <span className="text-accent font-display text-lg font-bold">R</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-lg font-display font-bold tracking-wider text-gradient-gold">
                  RANG BIRANGI
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Handcrafted Elegance
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              RANG BIRANGI brings you authentic handcrafted Indian fashion — bangles,
              earrings, sarees, and kurtis — made by skilled artisans across India.
            </p>
            <div className="flex gap-3">
              <a href="https://instagram.com/rangbirangi" target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-accent/20 transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://facebook.com/rangbirangi" target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-accent/20 transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="https://wa.me/919559974558" target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-accent/20 transition-colors">
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-display text-sm uppercase tracking-wider mb-4 text-accent">Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button onClick={() => setView({ name: 'shop', categorySlug: 'handmade-bangles' })}
                  className="hover:text-foreground transition-colors">Handmade Bangles</button>
              </li>
              <li>
                <button onClick={() => setView({ name: 'shop', categorySlug: 'earrings' })}
                  className="hover:text-foreground transition-colors">Earrings</button>
              </li>
              <li>
                <button onClick={() => setView({ name: 'shop', categorySlug: 'sarees' })}
                  className="hover:text-foreground transition-colors">Sarees</button>
              </li>
              <li>
                <button onClick={() => setView({ name: 'shop', categorySlug: 'kurtis' })}
                  className="hover:text-foreground transition-colors">Kurtis</button>
              </li>
              <li>
                <button onClick={() => setView({ name: 'shop', filter: 'new_arrivals' })}
                  className="hover:text-foreground transition-colors">New Arrivals</button>
              </li>
              <li>
                <button onClick={() => setView({ name: 'shop', filter: 'best_sellers' })}
                  className="hover:text-foreground transition-colors">Best Sellers</button>
              </li>
            </ul>
          </div>

          {/* Customer */}
          <div>
            <h4 className="font-display text-sm uppercase tracking-wider mb-4 text-accent">Customer</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button className="hover:text-foreground transition-colors">Track Order</button></li>
              <li><button className="hover:text-foreground transition-colors">Shipping Policy</button></li>
              <li><button className="hover:text-foreground transition-colors">Returns & Refunds</button></li>
              <li><button className="hover:text-foreground transition-colors">FAQ</button></li>
              <li><button className="hover:text-foreground transition-colors">Contact Us</button></li>
              <li><button className="hover:text-foreground transition-colors">Privacy Policy</button></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-sm uppercase tracking-wider mb-4 text-accent">Get in Touch</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-accent" />
                <a href="tel:+919559974558" className="hover:text-foreground transition-colors">+91 95599 74558</a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-accent" />
                <a href="mailto:care@rangbirangi.com" className="hover:text-foreground transition-colors">care@rangbirangi.com</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-accent" />
                <span>Bengaluru, Karnataka, India</span>
              </li>
            </ul>
            <div className="mt-4 p-3 rounded-lg glass border border-gold/20">
              <p className="text-xs text-muted-foreground">
                <span className="text-accent font-medium">UPI:</span> 9559974558@ptaxis
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2024 RANG BIRANGI. All rights reserved. Handcrafted with ♥ in India.
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Secure Payments</span>
            <span>·</span>
            <span>UPI · COD</span>
            <span>·</span>
            <span>Delhivery Shipping</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
