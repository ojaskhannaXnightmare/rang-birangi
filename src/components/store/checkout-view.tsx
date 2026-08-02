'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Check, CreditCard, Truck, MapPin, ShoppingBag, ArrowLeft, ArrowRight,
  Wallet, Banknote, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useCartStore } from '@/stores/cart-store'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'
import { formatINR } from '@/lib/helpers'

interface Address {
  id?: string
  fullName: string
  phone: string
  email?: string
  houseNo: string
  building?: string
  street: string
  area?: string
  landmark?: string
  city: string
  state: string
  pincode: string
  isDefault?: boolean
}

const EMPTY_ADDRESS: Address = {
  fullName: '', phone: '', email: '', houseNo: '', building: '',
  street: '', area: '', landmark: '', city: '', state: '', pincode: '',
}

export function CheckoutView() {
  const [step, setStep] = useState<'address' | 'payment' | 'review'>('address')
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [newAddress, setNewAddress] = useState<Address>(EMPTY_ADDRESS)
  const [showAddressForm, setShowAddressForm] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'COD'>('UPI')
  const [upiId, setUpiId] = useState('')
  const [paymentRef, setPaymentRef] = useState('')
  const [processing, setProcessing] = useState(false)

  const { items, fetch } = useCartStore()
  const setView = useUIStore((s) => s.setView)
  const user = useAuthStore((s) => s.user)
  const { toast } = useToast()

  useEffect(() => {
    fetch()
  }, [fetch])

  // Load saved addresses (non-blocking — if it fails, just show the form)
  useEffect(() => {
    if (!user) return
    fetch('/api/addresses')
      .then((r) => r.json())
      .then((d) => {
        if (d && d.addresses && d.addresses.length > 0) {
          setAddresses(d.addresses)
          const def = d.addresses.find((a: Address) => a.isDefault)
          if (def) {
            setSelectedAddressId(def.id || '')
            setShowAddressForm(false)
          }
        }
      })
      .catch(() => {
        // If addresses API fails, just show the form — no big deal
      })
  }, [user])

  const activeItems = items.filter((i) => !i.savedForLater)
  const subtotal = activeItems.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const shippingCost = subtotal >= 999 ? 0 : 49
  const total = subtotal + shippingCost

  // The address that will be used for the order
  // If user selected a saved address, use that. Otherwise use the form data.
  const selectedAddress: Address | null = selectedAddressId
    ? (addresses.find((a) => a.id === selectedAddressId) || null)
    : (showAddressForm && newAddress.fullName && newAddress.phone && newAddress.city
        ? newAddress
        : null)

  // ============ ADDRESS STEP ============
  const validateAddressForm = (): boolean => {
    if (!newAddress.fullName || !newAddress.phone || !newAddress.houseNo ||
        !newAddress.street || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' })
      return false
    }
    if (newAddress.phone.length < 10) {
      toast({ title: 'Phone number must be at least 10 digits', variant: 'destructive' })
      return false
    }
    if (newAddress.pincode.length < 6) {
      toast({ title: 'Pincode must be at least 6 digits', variant: 'destructive' })
      return false
    }
    return true
  }

  // Continue to Payment — NO API CALLS, just validate and move to next step
  const handleProceedToPayment = () => {
    if (showAddressForm) {
      // Validate the form
      if (!validateAddressForm()) return
      // Form is valid — move to payment step
      // The address data is stored in `newAddress` state and will be used at order placement
      setStep('payment')
    } else if (selectedAddressId) {
      setStep('payment')
    } else {
      toast({ title: 'Please select an address or fill the form', variant: 'destructive' })
    }
  }

  const handleSelectAddress = (id: string) => {
    setSelectedAddressId(id)
    setShowAddressForm(false)
  }

  const handleUseNewAddress = () => {
    setSelectedAddressId('')
    setShowAddressForm(true)
  }

  // ============ PAYMENT STEP ============
  const handleContinueToReview = () => {
    if (paymentMethod === 'UPI') {
      if (!paymentRef || paymentRef.trim().length < 6) {
        toast({ title: 'Please enter the UTR/Transaction Reference number', variant: 'destructive' })
        return
      }
    }
    setStep('review')
  }

  // ============ REVIEW STEP ============ PLACE ORDER ============
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast({ title: 'Please select an address', variant: 'destructive' })
      setStep('address')
      return
    }
    if (paymentMethod === 'UPI' && !paymentRef) {
      toast({ title: 'Please enter UPI payment reference', variant: 'destructive' })
      setStep('payment')
      return
    }

    setProcessing(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: selectedAddress,
          paymentMethod,
          paymentRef: paymentRef || undefined,
          upiId: upiId || undefined,
        }),
      })

      if (!res) {
        throw new Error('No response from server')
      }

      let data: any
      try {
        data = await res.json()
      } catch {
        throw new Error('Server returned invalid response. Please try again.')
      }

      if (res.ok && data.orderId) {
        setView({ name: 'order-success', orderId: data.orderId })
      } else {
        toast({ title: 'Checkout failed', description: data.error || 'Unknown error', variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Something went wrong', variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  if (activeItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">Your cart is empty</p>
        <Button onClick={() => setView({ name: 'home' })} className="bg-luxe-gradient">
          Continue Shopping
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => setView({ name: 'home' })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Checkout</h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center mb-8">
        {[
          { key: 'address', label: 'Address', icon: MapPin },
          { key: 'payment', label: 'Payment', icon: CreditCard },
          { key: 'review', label: 'Review', icon: ShoppingBag },
        ].map((s, i) => (
          <div key={s.key} className="flex items-center">
            <div className={`flex items-center gap-2 ${step === s.key ? 'text-accent' : step === 'review' || (step === 'payment' && s.key === 'address') ? 'text-green-500' : 'text-muted-foreground'}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${
                step === s.key ? 'border-accent bg-accent/10' :
                step === 'review' || (step === 'payment' && s.key === 'address') ? 'border-green-500 bg-green-500/10' : 'border-border'
              }`}>
                {step === 'review' || (step === 'payment' && s.key === 'address') ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <s.icon className="h-4 w-4" />
                )}
              </div>
              <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
            </div>
            {i < 2 && <div className="w-12 sm:w-24 h-px bg-border mx-2" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4">
          {/* ============ ADDRESS STEP ============ */}
          {step === 'address' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Saved addresses */}
              {addresses.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-display font-semibold">Saved Addresses</h3>
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => handleSelectAddress(addr.id!)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        selectedAddressId === addr.id
                          ? 'border-accent bg-accent/10'
                          : 'border-border hover:border-accent/50 glass'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{addr.fullName}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {addr.houseNo}, {addr.building && `${addr.building}, `}
                            {addr.street}, {addr.area && `${addr.area}, `}
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">📞 {addr.phone}</p>
                        </div>
                        {addr.isDefault && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">Default</span>
                        )}
                      </div>
                    </button>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUseNewAddress}
                    className="w-full border-dashed"
                  >
                    + Add New Address
                  </Button>
                </div>
              )}

              {/* New address form */}
              {showAddressForm && (
                <div className="p-5 rounded-xl glass border border-gold/20">
                  <h3 className="font-display font-semibold mb-4">
                    {addresses.length > 0 ? 'New Address' : 'Shipping Address'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Full Name *</Label>
                      <Input
                        value={newAddress.fullName}
                        onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                        className="bg-secondary/50"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Phone *</Label>
                      <Input
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        className="bg-secondary/50"
                        placeholder="10-digit mobile"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs text-muted-foreground mb-1 block">Email</Label>
                      <Input
                        type="email"
                        value={newAddress.email}
                        onChange={(e) => setNewAddress({ ...newAddress, email: e.target.value })}
                        className="bg-secondary/50"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">House No. *</Label>
                      <Input
                        value={newAddress.houseNo}
                        onChange={(e) => setNewAddress({ ...newAddress, houseNo: e.target.value })}
                        className="bg-secondary/50"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Building</Label>
                      <Input
                        value={newAddress.building}
                        onChange={(e) => setNewAddress({ ...newAddress, building: e.target.value })}
                        className="bg-secondary/50"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Street *</Label>
                      <Input
                        value={newAddress.street}
                        onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                        className="bg-secondary/50"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Area</Label>
                      <Input
                        value={newAddress.area}
                        onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })}
                        className="bg-secondary/50"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Landmark</Label>
                      <Input
                        value={newAddress.landmark}
                        onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                        className="bg-secondary/50"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">City *</Label>
                      <Input
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="bg-secondary/50"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">State *</Label>
                      <Input
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className="bg-secondary/50"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Pincode *</Label>
                      <Input
                        value={newAddress.pincode}
                        onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                        className="bg-secondary/50"
                        placeholder="6-digit pincode"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleProceedToPayment}
                    className="w-full mt-4 bg-luxe-gradient"
                  >
                    Continue to Payment <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}

              {!showAddressForm && selectedAddressId && (
                <Button
                  type="button"
                  onClick={() => setStep('payment')}
                  className="w-full bg-luxe-gradient"
                >
                  Continue to Payment <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </motion.div>
          )}

          {/* ============ PAYMENT STEP ============ */}
          {step === 'payment' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-5 rounded-xl glass border border-gold/20">
                <h3 className="font-display font-semibold mb-4">Select Payment Method</h3>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as 'UPI' | 'COD')}
                  className="space-y-3"
                >
                  {/* UPI */}
                  <div className={`p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === 'UPI' ? 'border-accent bg-accent/10' : 'border-border'
                  }`}>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="UPI" id="upi" />
                      <Wallet className="h-5 w-5 text-accent" />
                      <div className="flex-1">
                        <Label htmlFor="upi" className="font-medium cursor-pointer">UPI Payment</Label>
                        <p className="text-xs text-muted-foreground">Paytm, PhonePe, Google Pay, BHIM</p>
                      </div>
                      <span className="text-xs text-green-500 font-medium">INSTANT</span>
                    </div>
                    {paymentMethod === 'UPI' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t border-border space-y-3"
                      >
                        <div className="p-3 rounded-lg bg-secondary/30">
                          <p className="text-xs text-muted-foreground mb-1">Pay to UPI ID:</p>
                          <p className="font-mono text-accent font-medium">9559974558@ptaxis</p>
                          <p className="text-xs text-muted-foreground mt-1">Amount: {formatINR(total)}</p>
                        </div>

                        {/* UPI Deep Link Button */}
                        <a
                          href={`upi://pay?pa=9559974558@ptaxis&pn=RANG%20BIRANGI&am=${total}&cu=INR&tn=Order%20${Date.now()}`}
                          className="block w-full p-3 rounded-lg bg-gold-gradient text-background text-center font-medium hover:opacity-90 transition-opacity"
                        >
                          <Wallet className="h-4 w-4 inline mr-2" />
                          Pay {formatINR(total)} via UPI App
                        </a>

                        <p className="text-xs text-center text-muted-foreground">
                          ↑ Click above to open your UPI app (PhonePe, GPay, Paytm, BHIM)
                        </p>

                        <div className="h-px bg-border my-2" />

                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">
                            Your UPI ID (optional)
                          </Label>
                          <Input
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="yourname@upi"
                            className="bg-secondary/50"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">
                            Transaction Reference / UTR *
                          </Label>
                          <Input
                            value={paymentRef}
                            onChange={(e) => setPaymentRef(e.target.value)}
                            placeholder="Enter 12-digit UTR number"
                            className="bg-secondary/50"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            ⚠️ Enter the UTR/reference number from your UPI app after payment.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* COD */}
                  <div className={`p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === 'COD' ? 'border-accent bg-accent/10' : 'border-border'
                  }`}>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="COD" id="cod" />
                      <Banknote className="h-5 w-5 text-accent" />
                      <div className="flex-1">
                        <Label htmlFor="cod" className="font-medium cursor-pointer">Cash on Delivery</Label>
                        <p className="text-xs text-muted-foreground">Pay when you receive</p>
                      </div>
                      <span className="text-xs text-yellow-500 font-medium">₹0 fees</span>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep('address')} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Button type="button" onClick={handleContinueToReview} className="flex-1 bg-luxe-gradient">
                  Review Order <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ============ REVIEW STEP ============ */}
          {step === 'review' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Address review */}
              {selectedAddress && (
                <div className="p-4 rounded-xl glass border border-gold/20">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-accent" /> Shipping Address
                    </h3>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setStep('address')}>Edit</Button>
                  </div>
                  <p className="text-sm font-medium">{selectedAddress.fullName}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedAddress.houseNo}, {selectedAddress.building && `${selectedAddress.building}, `}
                    {selectedAddress.street}, {selectedAddress.area && `${selectedAddress.area}, `}
                    {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">📞 {selectedAddress.phone}</p>
                </div>
              )}

              {/* Payment review */}
              <div className="p-4 rounded-xl glass border border-gold/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display font-semibold flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-accent" /> Payment Method
                  </h3>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setStep('payment')}>Edit</Button>
                </div>
                <p className="text-sm">
                  {paymentMethod === 'UPI' ? (
                    <>UPI · {upiId || '9559974558@ptaxis'} {paymentRef && `· UTR: ${paymentRef}`}</>
                  ) : (
                    'Cash on Delivery'
                  )}
                </p>
              </div>

              {/* Items review */}
              <div className="p-4 rounded-xl glass border border-gold/20">
                <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-accent" /> Items ({activeItems.length})
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {activeItems.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <img src={item.product.images[0]} alt={item.product.name} className="w-14 h-16 object-cover rounded-md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity}
                          {item.color && ` · ${item.color}`}
                          {item.size && ` · ${item.size}`}
                        </p>
                      </div>
                      <p className="text-sm font-semibold">{formatINR(item.product.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep('payment')} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={processing}
                  className="flex-1 bg-gold-gradient text-background hover:opacity-90"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>Place Order · {formatINR(total)}</>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="p-5 rounded-xl glass border border-gold/20">
            <h3 className="font-display font-bold text-lg mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal ({activeItems.length} items)</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className={shippingCost === 0 ? 'text-green-500 font-medium' : ''}>
                  {shippingCost === 0 ? 'FREE' : formatINR(shippingCost)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="text-green-500">Included</span>
              </div>
              <div className="border-t border-border pt-2 mt-2 flex justify-between font-display font-bold text-lg">
                <span>Total</span>
                <span className="text-gradient-gold">{formatINR(total)}</span>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-secondary/30 text-xs text-muted-foreground">
              <p className="flex items-center gap-2 mb-1">
                <Truck className="h-3.5 w-3.5 text-accent" /> Delivered by Delhivery
              </p>
              <p className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-accent" /> 7-day easy returns
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
