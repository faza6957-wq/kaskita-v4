'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// Types
interface Student {
  nim: string
  nama: string
  password: string
  avatar: string
  avatarUrl?: string // URL for uploaded photo
  status: string
  denda: number
  paymentMethod?: string | null
  pendingSince?: string | null
  dendaPendingSince?: string | null
  previousStatus?: string // Store status before denda payment
  rejectionReason?: string // Alasan penolakan pembayaran
  lastPayment?: {
    amount: number
    paymentType: string
    date: string
    time: string
    method: string
  }
}

interface MidtransConfig {
  configured: boolean
  clientKey: string
  isProduction: boolean
}

interface Settings {
  webActive: boolean
  webInactiveMessage: string
  gelombang1Nominal: number
  gelombang2Nominal: number
  gelombang3Nominal: number
  langsungLunasNominal: number
  qrisExpiryMinutes: number
  groupName: string
  groupAvatar: string
  announcementActive: boolean
  groupAvatarUrl: string
}

interface BendaharaData {
  username: string
  password: string
  avatar: string
}

interface Transaction {
  id: string
  type: 'pemasukan_kas' | 'pemasukan_denda' | 'pengeluaran' | 'saldo_awal'
  nim?: string
  nama?: string
  nominal: number
  keterangan: string
  tanggal: string
  jam: string
  hari: string
  bulan: string
  tahun: string
}

interface Announcement {
  id: string
  sender: string
  senderNim?: string
  senderType: 'bendahara' | 'mahasiswa'
  message: string
  timestamp: string
  pinned: boolean
  reactions: { emoji: string; sender: string; senderNim?: string }[]
  replyTo?: {
    id: string
    sender: string
    message: string
  }
}

interface PendingPayment {
  nim: string
  type: 'kas' | 'denda'
  amount: number
  wave?: string
  timestamp: string
}

interface PengaduanMessage {
  id: string
  sender: string
  senderNim?: string
  senderType: 'bendahara' | 'mahasiswa'
  message: string
  timestamp: string
}

interface PengaduanThread {
  nim: string
  nama: string
  messages: PengaduanMessage[]
  status: 'active' | 'selesai'
  selesaiAt?: string
  createdAt: string
}

interface AppData {
  settings: Settings
  bendahara: BendaharaData
  students: Student[]
  transactions: Transaction[]
  announcements: Announcement[]
  pendingPayments: PendingPayment[]
  customSaldo: number
  pengaduanThreads?: PengaduanThread[]
}

// SVG Icons
const EyeOpenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
)

const EyeCloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
)

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
)

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
)

const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
)

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
)

const WhatsAppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
)

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
)

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
)

const PinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
)

export default function Home() {
  // State
  const [data, setData] = useState<AppData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false) // Lock untuk mencegah race condition
  const [view, setView] = useState<'login' | 'student' | 'bendahara'>('login')
  const [currentUser, setCurrentUser] = useState<Student | BendaharaData | null>(null)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // Dialog states
  const [dialog, setDialog] = useState<{
    show: boolean
    title: string
    message: string
    type: 'alert' | 'confirm' | 'form'
    inputs?: { placeholder: string; value: string; type?: string }[]
    onConfirm?: () => void
    showCancel?: boolean
  }>({ show: false, title: '', message: '', type: 'alert', showCancel: false })

  const [lupaPasswordDialog, setLupaPasswordDialog] = useState(false)
  const [lupaPasswordForm, setLupaPasswordForm] = useState({ nama: '', nim: '' })
  
  // Student dashboard states
  const [editNama, setEditNama] = useState(false)
  const [editPassword, setEditPassword] = useState(false)
  const [newNama, setNewNama] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showStudentPassword, setShowStudentPassword] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'qris' | null>(null)
  const [selectedBank, setSelectedBank] = useState<'jago' | 'dana' | null>(null)
  const [paymentWave, setPaymentWave] = useState<'g1' | 'g2' | 'g3' | 'lunas' | null>(null)
  const [qrisTimer, setQrisTimer] = useState<number | null>(null)
  const [qrisActive, setQrisActive] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  
  // Bendahara dashboard states
  const [editBendaharaPassword, setEditBendaharaPassword] = useState(false)
  const [newBendaharaPassword, setNewBendaharaPassword] = useState('')
  const [showBendaharaPassword, setShowBendaharaPassword] = useState(false)
  const [filterYear, setFilterYear] = useState('semua')
  const [filterMonth, setFilterMonth] = useState('semua')
  const [pengeluaranForm, setPengeluaranForm] = useState({ keterangan: '', nominal: '' })
  const [saldoAwalForm, setSaldoAwalForm] = useState('')
  const [selectedStudentNim, setSelectedStudentNim] = useState<string | null>(null)
  const [newDendaAmount, setNewDendaAmount] = useState('')
  const [announcementMessage, setAnnouncementMessage] = useState('')
  
  // Student management
  const [addStudentForm, setAddStudentForm] = useState({ nim: '', nama: '' })
  const [editStudentNim, setEditStudentNim] = useState<string | null>(null)
  const [editStudentForm, setEditStudentForm] = useState({ nim: '', nama: '' })
  
  // Announcement edit/delete
  const [editAnnouncementId, setEditAnnouncementId] = useState<string | null>(null)
  const [editAnnouncementMessage, setEditAnnouncementMessage] = useState('')
  
  // Rejection dialog
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectStudentNim, setRejectStudentNim] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  
  // Group settings
  const [editGroupName, setEditGroupName] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [showGroupAvatarPicker, setShowGroupAvatarPicker] = useState(false)
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null)
  const [viewPinnedMessage, setViewPinnedMessage] = useState<boolean>(false)
  const [replyTo, setReplyTo] = useState<{ id: string; sender: string; message: string } | null>(null)
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)

  const qrisIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const groupAvatarInputRef = useRef<HTMLInputElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const restoreInputRef = useRef<HTMLInputElement | null>(null)

  // Notifications
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [notificationEnabled, setNotificationEnabled] = useState(true)
  const [showNotificationRequest, setShowNotificationRequest] = useState(false)
  const previousStudentStateRef = useRef<{ status: string; denda: number; pengaduanMessages: number; rejectionReason?: string } | null>(null)
  const previousAnnouncementCountRef = useRef<number>(0)

  // Pengaduan
  const [pengaduanMessage, setPengaduanMessage] = useState('')
  const [selectedPengaduanNim, setSelectedPengaduanNim] = useState<string | null>(null)
  const pengaduanMessagesEndRef = useRef<HTMLDivElement | null>(null)

  // Receipt dialog
  const [showReceiptDialog, setShowReceiptDialog] = useState(false)
  const [receiptData, setReceiptData] = useState<{
    nama: string
    nim: string
    nominal: number
    paymentType: string
    date: string
    time: string
    method: string
  } | null>(null)
  const receiptRef = useRef<HTMLDivElement | null>(null)

  // Midtrans
  const [midtransConfig, setMidtransConfig] = useState<MidtransConfig | null>(null)
  const [midtransLoading, setMidtransLoading] = useState(false)
  const snapScriptLoaded = useRef(false)

  // Load Midtrans config
  useEffect(() => {
    const loadMidtransConfig = async () => {
      try {
        const res = await fetch('/api/midtrans/config')
        const config = await res.json()
        setMidtransConfig(config)
      } catch (error) {
        console.error('Failed to load Midtrans config:', error)
      }
    }
    loadMidtransConfig()
  }, [])

  // Load Midtrans Snap script
  const loadSnapScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (snapScriptLoaded.current) {
        resolve(true)
        return
      }
      
      if ((window as any).snap) {
        snapScriptLoaded.current = true
        resolve(true)
        return
      }

      const script = document.createElement('script')
      const src = midtransConfig?.isProduction 
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js'
      
      script.src = src
      script.setAttribute('data-client-key', midtransConfig?.clientKey || '')
      script.onload = () => {
        snapScriptLoaded.current = true
        resolve(true)
      }
      script.onerror = () => {
        console.error('Failed to load Midtrans Snap script')
        resolve(false)
      }
      document.body.appendChild(script)
    })
  }

  // Pay with Midtrans QRIS
  const payWithMidtrans = async (amount: number, paymentType: string) => {
    if (!data || !currentUser || !('nim' in currentUser)) return
    
    if (!midtransConfig?.configured) {
      showToast('Midtrans belum dikonfigurasi. Gunakan QRIS manual.', 'error')
      return
    }

    // Check minimum amount
    if (amount < 10000) {
      showToast('Minimal pembayaran QRIS otomatis Rp 10.000. Gunakan QRIS manual.', 'error')
      setPaymentMethod(null)
      setPaymentWave(null)
      return
    }

    setMidtransLoading(true)
    
    try {
      const orderId = `KAS-${currentUser.nim}-${Date.now()}`
      
      const res = await fetch('/api/midtrans/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount,
          customerName: currentUser.nama,
          customerNim: currentUser.nim,
          paymentType
        })
      })

      const result = await res.json()
      console.log('Midtrans API result:', result)

      if (!result.success) {
        // Show detailed error
        const errorMsg = result.details || result.error || 'Gagal membuat transaksi'
        showToast(`${result.error}. ${result.details ? JSON.stringify(result.details) : ''}`, 'error')
        setMidtransLoading(false)
        return
      }

      // Load Snap script
      const loaded = await loadSnapScript()
      if (!loaded) {
        showToast('Gagal memuat Midtrans Snap', 'error')
        setMidtransLoading(false)
        return
      }

      // Update student status to pending
      let newStatus = 'pending_g1'
      if (paymentType === 'Langsung Lunas') newStatus = 'pending_lunas'
      else if (paymentType === 'Gelombang 2') newStatus = 'pending_g2'
      else if (paymentType === 'Gelombang 3') newStatus = 'pending_g3'
      else if (paymentType === 'Denda') newStatus = 'pending_denda'

      const updatedStudents = data.students.map(s => {
        if (s.nim === currentUser.nim) {
          const updated: Student = {
            ...s,
            status: newStatus,
            pendingSince: new Date().toISOString(),
            rejectionReason: undefined
          }
          if (paymentType === 'Denda') {
            updated.previousStatus = s.status
          }
          return updated
        }
        return s
      })

      await saveData({ ...data, students: updatedStudents })

      // Open Snap popup
      (window as any).snap.pay(result.token, {
        onSuccess: function(snapResult: any) {
          console.log('Payment success:', snapResult)
          showToast('Pembayaran berhasil! Menunggu verifikasi otomatis.', 'success')
          setPaymentMethod(null)
          setPaymentWave(null)
        },
        onPending: function(snapResult: any) {
          console.log('Payment pending:', snapResult)
          showToast('Pembayaran tertunda. Silakan selesaikan pembayaran QRIS.', 'info')
        },
        onError: function(snapResult: any) {
          console.log('Payment error:', snapResult)
          showToast('Terjadi kesalahan pembayaran. Coba lagi.', 'error')
        },
        onClose: function() {
          console.log('Payment popup closed')
          showToast('Popup ditutup. Silakan selesaikan pembayaran.', 'info')
        }
      })

    } catch (error) {
      console.error('Midtrans error:', error)
      showToast('Gagal memproses pembayaran. Periksa koneksi internet.', 'error')
    } finally {
      setMidtransLoading(false)
    }
  }

  // Helper functions
  const getDateTime = () => {
    const now = new Date()
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    return {
      hari: days[now.getDay()],
      tanggal: now.getDate(),
      bulan: months[now.getMonth()],
      tahun: now.getFullYear(),
      jam: now.getHours().toString().padStart(2, '0'),
      menit: now.getMinutes().toString().padStart(2, '0')
    }
  }

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num)
  }

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 z-[9999] px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium animate-pulse ${
      type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-[#8B7355]'
    }`
    toast.textContent = message
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 3000)
  }

  // Notification functions
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      showToast('Browser tidak mendukung notifikasi', 'error')
      return
    }
    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      if (permission === 'granted') {
        showToast('Notifikasi diaktifkan!', 'success')
        setNotificationEnabled(true)
        localStorage.setItem('kaskita_notifications', 'true')
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
    }
    setShowNotificationRequest(false)
  }

  const toggleNotifications = async () => {
    if (!('Notification' in window)) {
      showToast('Browser tidak mendukung notifikasi', 'error')
      return
    }
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      if (permission === 'granted') {
        setNotificationEnabled(true)
        localStorage.setItem('kaskita_notifications', 'true')
        showToast('Notifikasi diaktifkan!', 'success')
      }
      return
    }
    if (Notification.permission === 'granted') {
      const newState = !notificationEnabled
      setNotificationEnabled(newState)
      localStorage.setItem('kaskita_notifications', String(newState))
      showToast(newState ? 'Notifikasi diaktifkan!' : 'Notifikasi dinonaktifkan!', 'info')
    }
  }

  const sendNotification = (title: string, body: string) => {
    if (notificationPermission !== 'granted' || !notificationEnabled) return
    try {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'kaskita-notification'
      })
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
      setTimeout(() => notification.close(), 5000)
    } catch (error) {
      console.error('Error sending notification:', error)
    }
  }

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/data')
      const jsonData = await res.json()
      setData(jsonData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Save data - dengan lock untuk mencegah race condition
  const saveData = async (newData: AppData): Promise<boolean> => {
    if (isSaving) {
      console.log('Save blocked - already saving')
      return false
    }
    
    setIsSaving(true)
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      })
      
      if (res.ok) {
        setData(newData)
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to save data:', error)
      return false
    } finally {
      setIsSaving(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Check notification permission on login
  useEffect(() => {
    if (view === 'student' && currentUser && 'nim' in currentUser) {
      if ('Notification' in window) {
        const permission = Notification.permission
        setNotificationPermission(permission)
        const savedPref = localStorage.getItem('kaskita_notifications')
        if (savedPref !== null) {
          setNotificationEnabled(savedPref === 'true')
        }
        if (permission === 'default') {
          const timer = setTimeout(() => {
            setShowNotificationRequest(true)
          }, 2000)
          return () => clearTimeout(timer)
        }
      }
    }
  }, [view, currentUser])

  // Check notification for bendahara
  useEffect(() => {
    if (view === 'bendahara' && currentUser) {
      if ('Notification' in window) {
        const permission = Notification.permission
        setNotificationPermission(permission)
        const savedPref = localStorage.getItem('kaskita_notifications')
        if (savedPref !== null) {
          setNotificationEnabled(savedPref === 'true')
        }
      }
    }
  }, [view, currentUser])

  // Auto refresh for student - skip jika sedang saving
  useEffect(() => {
    if (view === 'student' && currentUser) {
      refreshIntervalRef.current = setInterval(() => {
        if (!isSaving) { // Only fetch if not saving
          fetchData()
        }
      }, 5000)
    }
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [view, currentUser, fetchData, isSaving])

  // QRIS timer
  useEffect(() => {
    if (qrisActive && qrisTimer !== null) {
      qrisIntervalRef.current = setInterval(() => {
        setQrisTimer(prev => {
          if (prev === null || prev <= 0) {
            setQrisActive(false)
            if (qrisIntervalRef.current) clearInterval(qrisIntervalRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (qrisIntervalRef.current) {
        clearInterval(qrisIntervalRef.current)
      }
    }
  }, [qrisActive])

  // Update current user when data changes
  useEffect(() => {
    if (data && currentUser) {
      if ('nim' in currentUser) {
        const updatedStudent = data.students.find(s => s.nim === currentUser.nim)
        if (updatedStudent) {
          setCurrentUser(updatedStudent)
        }
      }
    }
  }, [data, currentUser])

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    if (data && data.announcements.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [data?.announcements.length])

  // Login handler
  const handleLogin = () => {
    if (!data) return

    const { username, password } = loginForm

    // Check bendahara login
    if (username.toLowerCase() === data.bendahara.username.toLowerCase() && password === data.bendahara.password) {
      setCurrentUser(data.bendahara)
      setView('bendahara')
      setLoginForm({ username: '', password: '' })
      return
    }

    // Check student login
    const student = data.students.find(s => s.nim === username && s.password === password)
    if (student) {
      if (!data.settings.webActive) {
        showDialog('Info 🏠', data.settings.webInactiveMessage, 'alert')
        return
      }
      setCurrentUser(student)
      setView('student')
      setLoginForm({ username: '', password: '' })
      return
    }

    showDialog('Gagal ❌', 'NIM atau Password salah!', 'alert')
  }

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null)
    setView('login')
    setSidebarOpen(false)
    setActiveTab('dashboard')
    setPaymentMethod(null)
    setSelectedBank(null)
    setPaymentWave(null)
    setQrisActive(false)
    setQrisTimer(null)
  }

  // Dialog functions
  const showDialog = (title: string, message: string, type: 'alert' | 'confirm' | 'form' = 'alert', onConfirm?: () => void, inputs?: { placeholder: string; value: string; type?: string }[]) => {
    setDialog({
      show: true,
      title,
      message,
      type,
      onConfirm,
      inputs,
      showCancel: type === 'confirm'
    })
  }

  const closeDialog = () => {
    setDialog({ ...dialog, show: false })
  }

  const handleDialogConfirm = () => {
    if (dialog.onConfirm) {
      dialog.onConfirm()
    }
    closeDialog()
  }

  // WhatsApp handlers
  const openWhatsApp = (message: string) => {
    const encoded = encodeURIComponent(message)
    window.open(`https://wa.me/6285117455265?text=${encoded}`, '_blank')
  }

  const handleLupaPassword = () => {
    if (!lupaPasswordForm.nama || !lupaPasswordForm.nim) {
      showToast('Isi semua field!', 'error')
      return
    }
    const dt = getDateTime()
    const message = `Halo Bendahara, saya lupa password.
👤 Nama: ${lupaPasswordForm.nama.toUpperCase()}
🆔 NIM: ${lupaPasswordForm.nim}
📅 Tanggal: ${dt.hari}, ${dt.tanggal} ${dt.bulan} ${dt.tahun}
⏰ Jam: ${dt.jam}.${dt.menit}
Mohon bantuannya reset password ya, terima kasih.`
    openWhatsApp(message)
    setLupaPasswordDialog(false)
    setLupaPasswordForm({ nama: '', nim: '' })
  }

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'belum_bayar': return 'Belum Bayar'
      case 'pending_g1': return 'Pending Gel-1'
      case 'verified_g1': return 'Gelombang-1'
      case 'pending_g2': return 'Pending Gel-2'
      case 'verified_g2': return 'Gelombang-2'
      case 'pending_g3': return 'Pending Gel-3'
      case 'verified_g3':
      case 'lunas': return 'LUNAS ✓'
      case 'pending_lunas': return 'Pending Lunas'
      case 'rejected': return 'Ditolak'
      case 'pending_denda': return 'Pending Denda'
      case 'langsung_lunas': return 'Langsung Lunas'
      default: return status
    }
  }

  // Get payment amount based on status
  const getPaymentAmount = (status: string, settings: Settings) => {
    switch (status) {
      case 'belum_bayar': return settings.gelombang1Nominal
      case 'verified_g1': return settings.gelombang2Nominal
      case 'verified_g2': return settings.gelombang3Nominal
      case 'lunas':
      case 'verified_g3': return 0
      default: return settings.gelombang1Nominal
    }
  }

  // Student payment handlers
  const handleConfirmPayment = () => {
    if (!data || !currentUser || !('nim' in currentUser)) return
    
    showDialog(
      'Konfirmasi Pembayaran 🧾',
      'Apakah Anda yakin ingin melakukan pembayaran?',
      'confirm',
      () => {
        proceedPayment()
      }
    )
  }

  const proceedPayment = async () => {
    if (!data || !currentUser || !('nim' in currentUser)) return
    
    const student = data.students.find(s => s.nim === currentUser.nim)
    if (!student) return

    let newStatus = student.status
    let amount = 0
    let waveText = ''

    if (student.denda > 0) {
      // Pay denda first - simpan previousStatus untuk restore nanti
      newStatus = 'pending_denda'
      amount = student.denda
      waveText = 'Pelunasan Denda'
    } else {
      // Prioritaskan paymentWave yang dipilih user
      // Jika pilih LANGSUNG LUNAS, gunakan itu (hanya jika belum bayar apapun)
      if (paymentWave === 'lunas' && (student.status === 'belum_bayar' || student.status === 'rejected')) {
        newStatus = 'pending_lunas'
        amount = data.settings.langsungLunasNominal
        waveText = 'LUNAS'
      } else if (paymentWave === 'g1' && (student.status === 'belum_bayar' || student.status === 'rejected')) {
        newStatus = 'pending_g1'
        amount = data.settings.gelombang1Nominal
        waveText = 'Gelombang 1'
      } else if (student.status === 'belum_bayar') {
        // Default ke gelombang 1 jika tidak pilih
        newStatus = 'pending_g1'
        amount = data.settings.gelombang1Nominal
        waveText = 'Gelombang 1'
      } else if (paymentWave === 'g2' || student.status === 'verified_g1') {
        newStatus = 'pending_g2'
        amount = data.settings.gelombang2Nominal
        waveText = 'Gelombang 2'
      } else if (paymentWave === 'g3' || student.status === 'verified_g2') {
        newStatus = 'pending_g3'
        amount = data.settings.gelombang3Nominal
        waveText = 'Gelombang 3'
      } else if (student.status === 'verified_g1') {
        newStatus = 'pending_g2'
        amount = data.settings.gelombang2Nominal
        waveText = 'Gelombang 2'
      } else if (student.status === 'verified_g2') {
        newStatus = 'pending_g3'
        amount = data.settings.gelombang3Nominal
        waveText = 'Gelombang 3'
      }
    }

    const dt = getDateTime()
    let message = ''
    
    if (student.denda > 0) {
      message = `Halo Bendahara, saya sudah bayar DENDA.
👤 Nama: ${student.nama}
🆔 NIM: ${student.nim}
💰 Nominal: Rp ${formatRupiah(amount)}
📊 Status: Pelunasan Denda
📅 Tanggal: ${dt.hari}, ${dt.tanggal} ${dt.bulan} ${dt.tahun}
⏰ Jam: ${dt.jam}.${dt.menit}`
    } else if (paymentMethod === 'qris') {
      message = `Halo Bendahara, saya sudah bayar KAS/Denda.
👤 Nama: ${student.nama}
🆔 NIM: ${student.nim}
💰 Nominal: Rp ${formatRupiah(amount)}
📊 Status: ${waveText} (Qris)
📅 Tanggal: ${dt.hari}, ${dt.tanggal} ${dt.bulan} ${dt.tahun}
⏰ Jam: ${dt.jam}.${dt.menit}`
    } else {
      message = `Halo Bendahara, saya sudah bayar KAS.
👤 Nama: ${student.nama}
🆔 NIM: ${student.nim}
💰 Nominal: Rp ${formatRupiah(amount)}
📊 Status: ${waveText}
📅 Tanggal: ${dt.hari}, ${dt.tanggal} ${dt.bulan} ${dt.tahun}
⏰ Jam: ${dt.jam}.${dt.menit}`
    }

    // Update student status
    const updatedStudents = data.students.map(s => {
      if (s.nim === student.nim) {
        const updated: Student = {
          ...s,
          status: newStatus,
          pendingSince: new Date().toISOString(),
          rejectionReason: undefined, // Clear rejection reason on new payment
          lastPayment: {
            amount,
            paymentType: waveText,
            date: `${dt.hari}, ${dt.tanggal} ${dt.bulan} ${dt.tahun}`,
            time: `${dt.jam}.${dt.menit}`,
            method: selectedBank === 'jago' ? 'Bank Jago' : selectedBank === 'dana' ? 'DANA' : paymentMethod === 'qris' ? 'QRIS' : 'Transfer Manual'
          }
        }
        // Simpan previousStatus saat membayar denda untuk restore nanti
        if (student.denda > 0) {
          // Simpan status saat ini sebelum denda dibayar
          if (!s.previousStatus) {
            updated.previousStatus = s.status
          }
        }
        return updated
      }
      return s
    })

    const newData = { ...data, students: updatedStudents }
    
    // Await saveData to ensure data is saved
    const saved = await saveData(newData)
    
    if (saved) {
      // Update currentUser after successful save
      const updatedStudent = updatedStudents.find(s => s.nim === student.nim)
      if (updatedStudent) {
        setCurrentUser(updatedStudent)
      }
      showToast('Pembayaran dicatat! Silakan kirim bukti ke Bendahara.', 'success')
    } else {
      showToast('Gagal menyimpan data. Coba lagi.', 'error')
      return
    }
    
    // Open WhatsApp for confirmation
    openWhatsApp(message)
    
    // Reset payment states
    setPaymentMethod(null)
    setSelectedBank(null)
    setPaymentWave(null)
    setQrisActive(false)
    setQrisTimer(null)
  }

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showToast('Berhasil disalin! 📋', 'success')
  }

  // Download QRIS
  const downloadQRIS = () => {
    const link = document.createElement('a')
    link.href = '/qris.png'
    link.download = 'QRIS-Pembayaran.png'
    link.click()
  }

  // Download Receipt as Image (Alfamart/Indomaret style)
  const downloadReceiptAsImage = async () => {
    if (!receiptRef.current || !receiptData) return
    
    try {
      // Use html2canvas-like approach with canvas
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      // Set canvas size for thermal receipt
      const width = 320
      const padding = 16
      canvas.width = width
      canvas.height = 600 // Will be adjusted
      
      // White background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, canvas.height)
      
      // Font settings
      ctx.textAlign = 'center'
      ctx.fillStyle = '#000000'
      
      let y = padding + 20
      
      // Header
      ctx.font = 'bold 14px monospace'
      ctx.fillText('═════════════════════', width/2, y)
      y += 18
      ctx.font = 'bold 16px monospace'
      ctx.fillText('KASKITA', width/2, y)
      y += 16
      ctx.font = '11px monospace'
      ctx.fillText('Sistem Kas Kelas', width/2, y)
      y += 14
      ctx.font = 'bold 14px monospace'
      ctx.fillText('═════════════════════', width/2, y)
      y += 22
      
      // Title
      ctx.font = 'bold 14px monospace'
      ctx.fillText('STRUK PEMBAYARAN', width/2, y)
      y += 20
      
      // Divider
      ctx.fillText('───────────────────', width/2, y)
      y += 20
      
      // Content - left aligned
      ctx.textAlign = 'left'
      ctx.font = '12px monospace'
      
      const lineHeight = 18
      const leftX = padding
      
      // Nama
      ctx.fillText('Nama', leftX, y)
      ctx.textAlign = 'right'
      ctx.fillText(receiptData.nama.substring(0, 20), width - padding, y)
      y += lineHeight
      ctx.textAlign = 'left'
      
      // NIM
      ctx.fillText('NIM', leftX, y)
      ctx.textAlign = 'right'
      ctx.fillText(receiptData.nim, width - padding, y)
      y += lineHeight
      ctx.textAlign = 'left'
      
      // Jenis
      ctx.fillText('Jenis', leftX, y)
      ctx.textAlign = 'right'
      ctx.fillText(receiptData.paymentType, width - padding, y)
      y += lineHeight
      ctx.textAlign = 'left'
      
      // Metode
      ctx.fillText('Metode', leftX, y)
      ctx.textAlign = 'right'
      ctx.fillText(receiptData.method, width - padding, y)
      y += lineHeight
      ctx.textAlign = 'left'
      
      // Tanggal
      ctx.fillText('Tanggal', leftX, y)
      ctx.textAlign = 'right'
      const dateStr = receiptData.date.length > 22 ? receiptData.date.substring(0, 22) : receiptData.date
      ctx.fillText(dateStr, width - padding, y)
      y += lineHeight
      ctx.textAlign = 'left'
      
      // Waktu
      ctx.fillText('Waktu', leftX, y)
      ctx.textAlign = 'right'
      ctx.fillText(receiptData.time + ' WIB', width - padding, y)
      y += lineHeight + 5
      ctx.textAlign = 'left'
      
      // Divider
      ctx.textAlign = 'center'
      ctx.fillText('───────────────────', width/2, y)
      y += 18
      
      // Total - larger
      ctx.font = 'bold 14px monospace'
      ctx.fillText('TOTAL', width/2, y)
      y += 18
      ctx.font = 'bold 18px monospace'
      ctx.fillStyle = '#000000'
      ctx.fillText('Rp ' + formatRupiah(receiptData.nominal), width/2, y)
      y += 25
      
      // Divider
      ctx.font = '12px monospace'
      ctx.fillText('───────────────────', width/2, y)
      y += 20
      
      // Status
      ctx.font = '12px monospace'
      ctx.fillStyle = '#666666'
      ctx.fillText('Status: MENUNGGU KONFIRMASI', width/2, y)
      y += 18
      ctx.font = '10px monospace'
      ctx.fillText('Bukti pembayaran telah dikirim', width/2, y)
      y += 14
      ctx.fillText('ke Bendahara via WhatsApp', width/2, y)
      y += 25
      
      // Footer
      ctx.font = 'bold 14px monospace'
      ctx.fillStyle = '#000000'
      ctx.fillText('═════════════════════', width/2, y)
      y += 18
      ctx.font = '11px monospace'
      ctx.fillText('Terima kasih telah membayar!', width/2, y)
      y += 14
      ctx.fillText(data?.settings?.groupName || 'KasKita', width/2, y)
      y += 20
      
      // Resize canvas to actual content
      canvas.height = y + 10
      
      // Download
      const link = document.createElement('a')
      link.download = `Struk-${receiptData.nim}-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      
      showToast('Struk berhasil diunduh!', 'success')
    } catch (error) {
      console.error('Error downloading receipt:', error)
      showToast('Gagal mengunduh struk', 'error')
    }
  }

  // Bendahara handlers - Approve payment
  const handleVerifyPayment = (nim: string, approve: boolean) => {
    if (!data) return

    const student = data.students.find(s => s.nim === nim)
    if (!student) return

    // Jika reject, tampilkan dialog untuk memasukkan alasan
    if (!approve) {
      setRejectStudentNim(nim)
      setRejectReason('')
      setShowRejectDialog(true)
      return
    }

    // Proses approve
    let newStatus = student.status
    let transactionType: 'pemasukan_kas' | 'pemasukan_denda' = 'pemasukan_kas'
    let amount = 0
    let keterangan = ''

    if (student.status === 'pending_denda') {
      // Restore to previous status
      newStatus = student.previousStatus || 'belum_bayar'
      if (newStatus === 'pending_denda' || newStatus.includes('pending')) {
        newStatus = 'belum_bayar'
      }
      amount = student.denda
      transactionType = 'pemasukan_denda'
      keterangan = `Pembayaran Denda - ${student.nama}`
    } else if (student.status === 'pending_g1') {
      newStatus = 'verified_g1'
      amount = data.settings.gelombang1Nominal
      keterangan = `Kas Gelombang 1 - ${student.nama}`
    } else if (student.status === 'pending_g2') {
      newStatus = 'verified_g2'
      amount = data.settings.gelombang2Nominal
      keterangan = `Kas Gelombang 2 - ${student.nama}`
    } else if (student.status === 'pending_g3') {
      newStatus = 'lunas'
      amount = data.settings.gelombang3Nominal
      keterangan = `Kas Gelombang 3 - ${student.nama}`
    } else if (student.status === 'pending_lunas') {
      newStatus = 'lunas'
      amount = data.settings.langsungLunasNominal
      keterangan = `Kas Langsung Lunas - ${student.nama}`
    }

    const dt = getDateTime()
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: transactionType,
      nim: student.nim,
      nama: student.nama,
      nominal: amount,
      keterangan,
      tanggal: `${dt.tanggal}`,
      jam: `${dt.jam}.${dt.menit}`,
      hari: dt.hari,
      bulan: dt.bulan,
      tahun: dt.tahun
    }

    const updatedStudents = data.students.map(s => {
      if (s.nim === nim) {
        const updated: Student = { ...s, rejectionReason: undefined }
        
        if (student.status === 'pending_denda') {
          updated.denda = 0
          updated.status = newStatus
          delete updated.previousStatus
        } else {
          updated.status = newStatus
        }
        return updated
      }
      return s
    })

    saveData({
      ...data,
      students: updatedStudents,
      transactions: [...data.transactions, newTransaction]
    })

    showToast('Pembayaran diverifikasi! ✓', 'success')
  }

  // Handle reject with reason
  const handleRejectPayment = () => {
    if (!data || !rejectStudentNim) return

    const student = data.students.find(s => s.nim === rejectStudentNim)
    if (!student) return

    const updatedStudents = data.students.map(s => {
      if (s.nim === rejectStudentNim) {
        const updated: Student = { 
          ...s, 
          rejectionReason: rejectReason || 'Pembayaran ditolak oleh Bendahara'
        }
        
        // Restore status berdasarkan pending sebelumnya
        if (student.status === 'pending_denda') {
          updated.status = student.previousStatus || 'belum_bayar'
          // Tetap pertahankan denda
        } else if (student.status === 'pending_g1') {
          updated.status = 'belum_bayar'
        } else if (student.status === 'pending_g2') {
          updated.status = 'verified_g1'
        } else if (student.status === 'pending_g3') {
          updated.status = 'verified_g2'
        } else if (student.status === 'pending_lunas') {
          updated.status = 'belum_bayar'
        }
        return updated
      }
      return s
    })

    saveData({ ...data, students: updatedStudents })
    setShowRejectDialog(false)
    setRejectStudentNim(null)
    setRejectReason('')
    showToast('Pembayaran ditolak', 'error')
  }

  // Add denda - HANYA menambah denda, TIDAK mengubah status
  // Mahasiswa harus klik bayar denda sendiri
  const handleAddDenda = () => {
    if (!data || !selectedStudentNim || !newDendaAmount) return

    const amount = parseInt(newDendaAmount)
    if (isNaN(amount) || amount <= 0) {
      showToast('Nominal tidak valid!', 'error')
      return
    }

    const updatedStudents = data.students.map(s => {
      if (s.nim === selectedStudentNim) {
        // Simpan previousStatus jika belum ada
        // previousStatus digunakan saat denda dibayar untuk restore status
        const prevStatus = s.previousStatus || (s.status.includes('pending') ? 'belum_bayar' : s.status)
        
        return { 
          ...s, 
          denda: s.denda + amount, 
          previousStatus: prevStatus
        }
      }
      return s
    })

    saveData({ ...data, students: updatedStudents })
    setNewDendaAmount('')
    setSelectedStudentNim(null)
    showToast('Denda berhasil ditambahkan!', 'success')
  }

  // Hapus denda - hanya menghapus denda, tidak mengubah status
  const handleHapusDenda = (nim: string) => {
    if (!data) return

    const student = data.students.find(s => s.nim === nim)
    showDialog(
      'Hapus Denda 🗑️',
      `Apakah Anda yakin ingin menghapus denda mahasiswa ${student?.nama || ''} sebesar Rp ${formatRupiah(student?.denda || 0)}?`,
      'confirm',
      () => {
        const updatedStudents = data.students.map(s => {
          if (s.nim === nim) {
            const updated = { ...s, denda: 0 }
            delete updated.previousStatus
            return updated
          }
          return s
        })
        saveData({ ...data, students: updatedStudents })
        showToast('Denda berhasil dihapus!', 'success')
      }
    )
  }

  // Add pengeluaran
  const handleAddPengeluaran = () => {
    if (!data || !pengeluaranForm.keterangan || !pengeluaranForm.nominal) return

    const amount = parseInt(pengeluaranForm.nominal)
    if (isNaN(amount) || amount <= 0) {
      showToast('Nominal tidak valid!', 'error')
      return
    }

    const dt = getDateTime()
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'pengeluaran',
      nominal: amount,
      keterangan: pengeluaranForm.keterangan,
      tanggal: `${dt.tanggal}`,
      jam: `${dt.jam}.${dt.menit}`,
      hari: dt.hari,
      bulan: dt.bulan,
      tahun: dt.tahun
    }

    saveData({
      ...data,
      transactions: [...data.transactions, newTransaction]
    })

    setPengeluaranForm({ keterangan: '', nominal: '' })
    showToast('Pengeluaran dicatat!', 'success')
  }

  // Add saldo awal - saldo dihitung dari transaksi saja
  const handleAddSaldoAwal = () => {
    if (!data || !saldoAwalForm) return

    const amount = parseInt(saldoAwalForm)
    if (isNaN(amount) || amount <= 0) {
      showToast('Nominal tidak valid!', 'error')
      return
    }

    const dt = getDateTime()
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'saldo_awal',
      nominal: amount,
      keterangan: 'Saldo Awal',
      tanggal: `${dt.tanggal}`,
      jam: `${dt.jam}.${dt.menit}`,
      hari: dt.hari,
      bulan: dt.bulan,
      tahun: dt.tahun
    }

    // Saldo sudah dihitung dari transaksi di getStatistics(), tidak perlu customSaldo
    saveData({
      ...data,
      transactions: [...data.transactions, newTransaction]
    })

    setSaldoAwalForm('')
    showToast('Saldo awal ditambahkan!', 'success')
  }

  // Announcement handlers
  const handleSendAnnouncement = async () => {
    if (!data || !announcementMessage.trim()) return

    // Check if announcement is active for students
    if (currentUser && 'nim' in currentUser && data.settings.announcementActive === false) {
      showToast('Pengumuman sedang dinonaktifkan oleh Bendahara!', 'error')
      return
    }

    const dt = getDateTime()
    const sender = currentUser && 'nim' in currentUser 
      ? currentUser.nama 
      : 'Bendahara'
    const senderNim = currentUser && 'nim' in currentUser 
      ? currentUser.nim 
      : undefined

    const newAnnouncement: Announcement = {
      id: Date.now().toString(),
      sender,
      senderNim,
      senderType: currentUser && 'nim' in currentUser ? 'mahasiswa' : 'bendahara',
      message: announcementMessage,
      timestamp: `${dt.tanggal} ${dt.bulan} ${dt.tahun} ${dt.jam}:${dt.menit}`,
      pinned: false,
      reactions: [],
      replyTo: replyTo || undefined
    }

    await saveData({
      ...data,
      announcements: [...data.announcements, newAnnouncement]
    })

    setAnnouncementMessage('')
    setReplyTo(null)
    showToast('Pesan terkirim!', 'success')
  }

  const handlePinAnnouncement = async (id: string) => {
    if (!data) return

    const updatedAnnouncements = data.announcements.map(a => ({
      ...a,
      pinned: a.id === id ? !a.pinned : false
    }))

    await saveData({ ...data, announcements: updatedAnnouncements })
    showToast('Pesan disematkan!', 'success')
  }

  const handleDeleteAnnouncement = (id: string) => {
    if (!data) return

    showDialog(
      'Hapus Pesan 🗑️',
      'Apakah Anda yakin ingin menghapus pesan ini?',
      'confirm',
      () => {
        saveData({
          ...data,
          announcements: data.announcements.filter(a => a.id !== id)
        })
        showToast('Pesan dihapus!', 'success')
      }
    )
  }

  const handleEditAnnouncement = (id: string, currentMessage: string) => {
    setEditAnnouncementId(id)
    setEditAnnouncementMessage(currentMessage)
  }

  const handleSaveEditAnnouncement = async () => {
    if (!data || !editAnnouncementId) return

    const updatedAnnouncements = data.announcements.map(a => {
      if (a.id === editAnnouncementId) {
        return { ...a, message: editAnnouncementMessage }
      }
      return a
    })

    await saveData({ ...data, announcements: updatedAnnouncements })
    setEditAnnouncementId(null)
    setEditAnnouncementMessage('')
    showToast('Pesan diperbarui!', 'success')
  }

  const handleClearAllAnnouncements = () => {
    if (!data) return

    showDialog(
      'Hapus Semua Pesan 🗑️',
      'Apakah Anda yakin ingin menghapus semua pesan?',
      'confirm',
      async () => {
        await saveData({ ...data, announcements: [] })
        showToast('Semua pesan dihapus!', 'success')
      }
    )
  }

  // Student management
  const handleAddStudent = () => {
    if (!data || !addStudentForm.nim || !addStudentForm.nama) return

    const exists = data.students.find(s => s.nim === addStudentForm.nim)
    if (exists) {
      showToast('NIM sudah terdaftar!', 'error')
      return
    }

    const newStudent: Student = {
      nim: addStudentForm.nim,
      nama: addStudentForm.nama.toUpperCase(),
      password: addStudentForm.nim,
      avatar: '👩🏻‍⚕️',
      status: 'belum_bayar',
      denda: 0
    }

    saveData({
      ...data,
      students: [...data.students, newStudent]
    })

    setAddStudentForm({ nim: '', nama: '' })
    showToast('Mahasiswa ditambahkan!', 'success')
  }

  const handleEditStudent = () => {
    if (!data || !editStudentNim) return

    const updatedStudents = data.students.map(s => {
      if (s.nim === editStudentNim) {
        return {
          ...s,
          nim: editStudentForm.nim,
          nama: editStudentForm.nama.toUpperCase()
        }
      }
      return s
    })

    saveData({ ...data, students: updatedStudents })
    setEditStudentNim(null)
    setEditStudentForm({ nim: '', nama: '' })
    showToast('Data mahasiswa diperbarui!', 'success')
  }

  const handleDeleteStudent = (nim: string) => {
    if (!data) return

    showDialog(
      'Hapus Mahasiswa 🗑️',
      'Apakah Anda yakin ingin menghapus mahasiswa ini?',
      'confirm',
      () => {
        saveData({
          ...data,
          students: data.students.filter(s => s.nim !== nim)
        })
        showToast('Mahasiswa dihapus!', 'success')
      }
    )
  }

  // Reset functions
  const handleResetKeuangan = () => {
    if (!data) return

    showDialog(
      'Reset Keuangan ⚠️',
      'Status pembayaran akan direset. Nama, NIM, Password, Denda, Laporan Keuangan, Pengumuman, dan Pengaduan TETAP AMAN. Lanjutkan?',
      'confirm',
      () => {
        const updatedStudents = data.students.map(s => ({
          ...s,
          status: 'belum_bayar',
          // denda TIDAK direset - tetap aman
          pendingSince: null,
          dendaPendingSince: null,
          rejectionReason: undefined,
          previousStatus: undefined,
          // lastPayment TIDAK dihapus - struk tetap tersedia
        }))

        saveData({
          ...data,
          students: updatedStudents,
          // transactions TIDAK dihapus - laporan keuangan tetap aman
          // announcements TIDAK dihapus - pengumuman tetap aman
          // pengaduanThreads TIDAK dihapus - pengaduan tetap aman
          // denda TIDAK direset - tetap aman
          customSaldo: 0
        })
        showToast('Keuangan direset! Denda, Laporan Keuangan, Pengumuman, dan Pengaduan tetap aman.', 'success')
      }
    )
  }

  const handleResetPabrik = () => {
    if (!data) return

    showDialog(
      'Reset Pabrik ⚠️',
      'Semua data akan direset KECUALI: Nama, NIM, Password, dan Pengumuman. DENDA DAN LAPORAN KEUANGAN AKAN TERHAPUS! Lanjutkan?',
      'confirm',
      () => {
        const updatedStudents = data.students.map(s => ({
          ...s,
          status: 'belum_bayar',
          denda: 0,
          pendingSince: null,
          dendaPendingSince: null,
          rejectionReason: undefined,
          previousStatus: undefined,
          lastPayment: undefined
        }))

        saveData({
          ...data,
          students: updatedStudents,
          transactions: [], // LAPORAN KEUANGAN DIHAPUS
          // announcements TIDAK dihapus - pengumuman tetap aman
          pengaduanThreads: [], // Pengaduan juga dihapus di reset pabrik
          customSaldo: 0
        })
        showToast('Data direset pabrik! Nama, NIM, Password, dan Pengumuman tetap aman.', 'success')
      }
    )
  }

  // Backup Data - Download JSON file
  const handleBackup = () => {
    if (!data) return

    const backupData = {
      ...data,
      backupDate: new Date().toISOString(),
      backupVersion: '1.0'
    }

    const jsonString = JSON.stringify(backupData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const dt = getDateTime()
    const filename = `backup-kas-${dt.tahun}-${dt.bulan.toLowerCase()}-${dt.tanggal}.json`

    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showToast('Backup berhasil diunduh! Simpan file ini di tempat aman.', 'success')
  }

  // Restore Data - Upload JSON file
  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const restoredData = JSON.parse(e.target?.result as string)

        // Validate data structure
        if (!restoredData.students || !restoredData.settings) {
          showToast('File backup tidak valid!', 'error')
          return
        }

        showDialog(
          'Restore Backup 📂',
          `Data akan diganti dengan backup dari: ${restoredData.backupDate || 'tanggal tidak diketahui'}\n\nPastikan kamu sudah backup data sekarang!\n\nLanjutkan?`,
          'confirm',
          () => {
            saveData({
              ...restoredData,
              // Remove backup metadata
              backupDate: undefined,
              backupVersion: undefined
            })
            showToast('Data berhasil dipulihkan dari backup!', 'success')
          }
        )
      } catch (error) {
        showToast('Gagal membaca file backup! Pastikan file valid.', 'error')
      }
    }
    reader.readAsText(file)

    // Reset input so same file can be selected again
    event.target.value = ''
  }

  // Update student profile
  const handleUpdateNama = () => {
    if (!data || !currentUser || !('nim' in currentUser) || !newNama) return

    const updatedStudents = data.students.map(s => {
      if (s.nim === currentUser.nim) {
        return { ...s, nama: newNama.toUpperCase() }
      }
      return s
    })

    saveData({ ...data, students: updatedStudents })
    setEditNama(false)
    setNewNama('')
    showToast('Nama diperbarui!', 'success')
  }

  const handleUpdatePassword = () => {
    if (!data || !currentUser || !('nim' in currentUser) || !newPassword) return

    const updatedStudents = data.students.map(s => {
      if (s.nim === currentUser.nim) {
        return { ...s, password: newPassword }
      }
      return s
    })

    saveData({ ...data, students: updatedStudents })
    setEditPassword(false)
    setNewPassword('')
    showToast('Password diperbarui!', 'success')
  }

  const handleUpdateAvatar = (avatar: string) => {
    if (!data || !currentUser || !('nim' in currentUser)) return

    const updatedStudents = data.students.map(s => {
      if (s.nim === currentUser.nim) {
        return { ...s, avatar }
      }
      return s
    })

    saveData({ ...data, students: updatedStudents })
    setShowAvatarPicker(false)
    showToast('Avatar diperbarui!', 'success')
  }

  // Update bendahara profile
  const handleUpdateBendaharaPassword = () => {
    if (!data || !newBendaharaPassword) return

    saveData({
      ...data,
      bendahara: { ...data.bendahara, password: newBendaharaPassword }
    })
    setEditBendaharaPassword(false)
    setNewBendaharaPassword('')
    showToast('Password Bendahara diperbarui!', 'success')
  }

  // Toggle web active
  const handleToggleWeb = () => {
    if (!data) return

    saveData({
      ...data,
      settings: {
        ...data.settings,
        webActive: !data.settings.webActive
      }
    })
    showToast(data.settings.webActive ? 'Web dinonaktifkan!' : 'Web diaktifkan!', 'info')
  }

  // Update group name
  const handleUpdateGroupName = async () => {
    if (!data || !newGroupName.trim()) return

    await saveData({
      ...data,
      settings: {
        ...data.settings,
        groupName: newGroupName.trim()
      }
    })
    setEditGroupName(false)
    setNewGroupName('')
    showToast('Nama grup diperbarui!', 'success')
  }

  // Update group avatar
  const handleUpdateGroupAvatar = async (avatar: string) => {
    if (!data) return

    await saveData({
      ...data,
      settings: {
        ...data.settings,
        groupAvatar: avatar,
        groupAvatarUrl: '' // Clear URL when using emoji
      }
    })
    setShowGroupAvatarPicker(false)
    showToast('Foto grup diperbarui!', 'success')
  }

  // Update group avatar with custom image URL
  const handleUpdateGroupAvatarUrl = async (url: string) => {
    if (!data) return

    await saveData({
      ...data,
      settings: {
        ...data.settings,
        groupAvatarUrl: url,
        groupAvatar: '' // Clear emoji when using URL
      }
    })
    showToast('Foto grup diperbarui!', 'success')
  }

  // Toggle announcement active (hanya bendahara bisa kirim)
  const handleToggleAnnouncement = async () => {
    if (!data) return

    await saveData({
      ...data,
      settings: {
        ...data.settings,
        announcementActive: !data.settings.announcementActive
      }
    })
    showToast(data.settings.announcementActive ? 'Pengumuman dinonaktifkan untuk mahasiswa!' : 'Pengumuman diaktifkan untuk semua!', 'info')
  }

  // Scroll to message and highlight it
  const scrollToMessage = (messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`)
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightedMessageId(messageId)
      // Remove highlight after 2 seconds
      setTimeout(() => setHighlightedMessageId(null), 2000)
    }
  }

  // Add reaction to announcement
  const handleAddReaction = (announcementId: string, emoji: string) => {
    if (!data || !currentUser) return

    const sender = currentUser && 'nim' in currentUser ? currentUser.nama : 'Bendahara'
    const senderNim = currentUser && 'nim' in currentUser ? currentUser.nim : undefined

    const updatedAnnouncements = data.announcements.map(a => {
      if (a.id === announcementId) {
        const reactions = a.reactions || []
        // Check if user already reacted with this emoji
        const existingIndex = reactions.findIndex(r => r.emoji === emoji && r.senderNim === senderNim)
        
        if (existingIndex >= 0) {
          // Remove reaction
          return { ...a, reactions: reactions.filter((_, i) => i !== existingIndex) }
        } else {
          // Add reaction
          return { ...a, reactions: [...reactions, { emoji, sender, senderNim }] }
        }
      }
      return a
    })

    saveData({ ...data, announcements: updatedAnnouncements })
    setShowReactionPicker(null)
  }

  // Calculate statistics
  const getStatistics = () => {
    if (!data) return { total: 0, lunas: 0, pending: 0, saldo: 0 }

    const total = data.students.length
    const lunas = data.students.filter(s => s.status === 'lunas' || s.status === 'verified_g3').length
    const pending = data.students.filter(s => 
      s.status.includes('pending') || s.status === 'rejected'
    ).length

    // Calculate saldo: sum of all income minus expenses
    let saldo = 0
    data.transactions.forEach(t => {
      if (t.type === 'pemasukan_kas' || t.type === 'pemasukan_denda' || t.type === 'saldo_awal') {
        saldo += t.nominal
      } else if (t.type === 'pengeluaran') {
        saldo -= t.nominal
      }
    })

    return { total, lunas, pending, saldo }
  }

  // Filter transactions
  const getFilteredTransactions = () => {
    if (!data) return []

    let filtered = [...data.transactions]

    // Filter tahun - compare as strings
    if (filterYear !== 'semua') {
      filtered = filtered.filter(t => {
        const tYear = String(t.tahun || '').trim()
        const fYear = String(filterYear).trim()
        return tYear === fYear
      })
    }

    // Filter bulan - compare month name
    if (filterMonth !== 'semua') {
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
      const monthName = months[parseInt(filterMonth) - 1]
      filtered = filtered.filter(t => {
        const tMonth = String(t.bulan || '').trim()
        return tMonth === monthName
      })
    }

    // Sort by date - newest first, using tanggal and tahun
    return filtered.sort((a, b) => {
      const dateA = new Date(`${a.tahun}-${a.bulan || '01'}-${a.tanggal || '01'}`).getTime()
      const dateB = new Date(`${b.tahun}-${b.bulan || '01'}-${b.tanggal || '01'}`).getTime()
      return dateB - dateA
    })
  }

  // Get available years
  const getAvailableYears = () => {
    if (!data) return []
    const currentYear = new Date().getFullYear()
    const years = new Set<string>()
    years.add('semua')
    
    // Add 5 years back and 50 years forward
    for (let i = currentYear - 5; i <= currentYear + 50; i++) {
      years.add(i.toString())
    }
    
    data.transactions.forEach(t => {
      if (t.tahun) years.add(t.tahun)
    })
    
    return Array.from(years).sort((a, b) => {
      if (a === 'semua') return -1
      if (b === 'semua') return 1
      return parseInt(b) - parseInt(a)
    })
  }

  // Generate PDF - Laporan Keuangan dengan TABEL BERNAMA
  const generatePDF = async () => {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    
    const stats = getStatistics()
    const transactions = getFilteredTransactions()
    
    // Header dengan background coklat gradient
    doc.setFillColor(139, 115, 85)
    doc.rect(0, 0, 210, 30, 'F')
    
    // Header title
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('LAPORAN KEUANGAN KAS', 105, 12, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const dt = getDateTime()
    doc.text(`${dt.hari}, ${dt.tanggal} ${dt.bulan} ${dt.tahun}`, 105, 22, { align: 'center' })
    
    // Summary per type
    const pemasukanKas = transactions.filter(t => t.type === 'pemasukan_kas').reduce((a, b) => a + b.nominal, 0)
    const pemasukanDenda = transactions.filter(t => t.type === 'pemasukan_denda').reduce((a, b) => a + b.nominal, 0)
    const saldoAwal = transactions.filter(t => t.type === 'saldo_awal').reduce((a, b) => a + b.nominal, 0)
    const pengeluaran = transactions.filter(t => t.type === 'pengeluaran').reduce((a, b) => a + b.nominal, 0)
    const totalPemasukan = pemasukanKas + pemasukanDenda + saldoAwal
    
    let y = 38
    doc.setTextColor(0, 0, 0)
    
    // TABEL RINGKASAN - Header coklat
    doc.setFillColor(139, 115, 85)
    doc.rect(15, y, 180, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('RINGKASAN KEUANGAN', 105, y + 5.5, { align: 'center' })
    y += 8
    
    // Tabel ringkasan 4 kolom dengan warna
    const colW = 45
    const ringkasanHeaders = ['Total Mahasiswa', 'Sudah Lunas', 'Belum/Pending', 'Saldo Kas']
    const ringkasanValues = [`${stats.total}`, `${stats.lunas}`, `${stats.pending}`, `Rp ${formatRupiah(stats.saldo)}`]
    const headerColors: [number, number, number][] = [[180, 140, 100], [100, 160, 100], [200, 160, 80], [100, 130, 160]]
    
    doc.setFontSize(8)
    ringkasanHeaders.forEach((h, i) => {
      // Header cell dengan warna
      doc.setFillColor(...headerColors[i])
      doc.rect(15 + i * colW, y, colW, 10, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.text(h, 15 + i * colW + colW/2, y + 4, { align: 'center' })
      
      // Value cell
      doc.setFillColor(255, 255, 255)
      doc.rect(15 + i * colW, y + 10, colW, 10, 'F')
      doc.setTextColor(60, 40, 20)
      doc.setFontSize(9)
      doc.text(ringkasanValues[i], 15 + i * colW + colW/2, y + 16, { align: 'center' })
    })
    y += 24
    
    // TABEL PEMASUKAN & PENGELUARAN
    doc.setFillColor(139, 115, 85)
    doc.rect(15, y, 180, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('DETAIL PEMASUKAN & PENGELUARAN', 105, y + 5.5, { align: 'center' })
    y += 8
    
    // Tabel 2 kolom
    doc.setFillColor(100, 160, 100) // Hijau untuk pemasukan
    doc.rect(15, y, 90, 8, 'F')
    doc.setFillColor(200, 100, 100) // Merah untuk pengeluaran
    doc.rect(105, y, 90, 8, 'F')
    
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text('PEMASUKAN', 60, y + 5, { align: 'center' })
    doc.text('PENGELUARAN', 150, y + 5, { align: 'center' })
    y += 8
    
    // Detail pemasukan - baris dengan warna
    const detailData = [
      ['Kas Mahasiswa', `Rp ${formatRupiah(pemasukanKas)}`, 'green'],
      ['Denda', `Rp ${formatRupiah(pemasukanDenda)}`, 'green'],
      ['Saldo Awal', `Rp ${formatRupiah(saldoAwal)}`, 'green'],
      ['Total Pemasukan', `Rp ${formatRupiah(totalPemasukan)}`, 'green-bold']
    ]
    
    doc.setFontSize(8)
    detailData.forEach((d, i) => {
      // Background bergantian
      doc.setFillColor(i % 2 === 0 ? 245 : 250, 255, i % 2 === 0 ? 245 : 250)
      doc.rect(15, y + i * 7, 90, 7, 'F')
      doc.setTextColor(40, 80, 40)
      doc.setFont('helvetica', d[2] === 'green-bold' ? 'bold' : 'normal')
      doc.text(d[0], 18, y + i * 7 + 5)
      doc.text(d[1], 102, y + i * 7 + 5, { align: 'right' })
    })
    
    // Pengeluaran
    doc.setFillColor(255, 245, 245)
    doc.rect(105, y, 90, 14, 'F')
    doc.setTextColor(180, 60, 60)
    doc.setFont('helvetica', 'normal')
    doc.text('Total Pengeluaran:', 108, y + 5)
    doc.setFont('helvetica', 'bold')
    doc.text(`Rp ${formatRupiah(pengeluaran)}`, 108, y + 11)
    
    y += 32
    
    // TABEL RIWAYAT TRANSAKSI
    doc.setFillColor(139, 115, 85)
    doc.rect(15, y, 180, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('RIWAYAT TRANSAKSI', 105, y + 5.5, { align: 'center' })
    y += 8
    
    // Table header - Kolom lebih proporsional
    const colWidths = [8, 22, 55, 25, 35, 35]
    const headers = ['No', 'Tanggal', 'Keterangan', 'Jenis', 'Nama', 'Nominal']

    // Header row dengan warna coklat muda
    doc.setFillColor(200, 175, 150)
    doc.rect(15, y, 180, 8, 'F')
    doc.setTextColor(60, 40, 20)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')

    let xPos = 15
    headers.forEach((h, i) => {
      doc.text(h, xPos + colWidths[i]/2, y + 5.5, { align: 'center' })
      xPos += colWidths[i]
    })
    y += 8

    // Table rows
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')

    transactions.forEach((t, i) => {
      if (y > 270) {
        doc.addPage()
        y = 20
        // Repeat header
        doc.setFillColor(200, 175, 150)
        doc.rect(15, y, 180, 8, 'F')
        doc.setTextColor(60, 40, 20)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'bold')
        xPos = 15
        headers.forEach((h, idx) => {
          doc.text(h, xPos + colWidths[idx]/2, y + 5.5, { align: 'center' })
          xPos += colWidths[idx]
        })
        y += 8
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
      }

      // Row background berdasarkan jenis transaksi
      let bgColor: [number, number, number]
      if (t.type === 'pengeluaran') {
        bgColor = [255, 235, 235] // Merah muda
      } else if (t.type === 'saldo_awal') {
        bgColor = [235, 245, 255] // Biru muda
      } else if (t.type === 'pemasukan_denda') {
        bgColor = [255, 250, 235] // Kuning muda
      } else {
        bgColor = [235, 255, 235] // Hijau muda
      }

      doc.setFillColor(...bgColor)
      doc.rect(15, y, 180, 8, 'F')

      // Border bawah
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.1)
      doc.line(15, y + 8, 195, y + 8)

      doc.setTextColor(40, 40, 40)
      xPos = 15

      // No
      doc.text(`${i + 1}`, xPos + colWidths[0]/2, y + 5, { align: 'center' })
      xPos += colWidths[0]

      // Tanggal
      doc.text(`${t.tanggal} ${String(t.bulan || '').substring(0,3)} ${t.tahun}`, xPos + colWidths[1]/2, y + 5, { align: 'center' })
      xPos += colWidths[1]

      // Keterangan - teks rata kiri, wrap jika perlu
      const keteranganText = String(t.keterangan || '-')
      const maxKeteranganWidth = colWidths[2] - 4
      let keteranganDisplay = keteranganText
      if (doc.getTextWidth(keteranganText) > maxKeteranganWidth) {
        // Truncate dengan ellipsis
        while (doc.getTextWidth(keteranganDisplay + '...') > maxKeteranganWidth && keteranganDisplay.length > 0) {
          keteranganDisplay = keteranganDisplay.slice(0, -1)
        }
        keteranganDisplay += '...'
      }
      doc.text(keteranganDisplay, xPos + 2, y + 5)
      xPos += colWidths[2]

      // Jenis
      const jenisText = t.type === 'pemasukan_kas' ? 'Kas' : t.type === 'pemasukan_denda' ? 'Denda' : t.type === 'saldo_awal' ? 'Saldo Awal' : 'Pengeluaran'
      doc.text(jenisText, xPos + colWidths[3]/2, y + 5, { align: 'center' })
      xPos += colWidths[3]

      // Nama - teks rata kiri, truncate dengan proper
      const namaText = String(t.nama || '-')
      const maxNamaWidth = colWidths[4] - 4
      let namaDisplay = namaText
      if (doc.getTextWidth(namaText) > maxNamaWidth) {
        while (doc.getTextWidth(namaDisplay + '...') > maxNamaWidth && namaDisplay.length > 0) {
          namaDisplay = namaDisplay.slice(0, -1)
        }
        namaDisplay += '...'
      }
      doc.text(namaDisplay, xPos + 2, y + 5)
      xPos += colWidths[4]

      // Nominal
      if (t.type === 'pengeluaran') {
        doc.setTextColor(180, 50, 50)
        doc.text(`-Rp ${formatRupiah(t.nominal)}`, xPos + colWidths[5] - 2, y + 5, { align: 'right' })
      } else {
        doc.setTextColor(30, 120, 30)
        doc.text(`+Rp ${formatRupiah(t.nominal)}`, xPos + colWidths[5] - 2, y + 5, { align: 'right' })
      }

      y += 8
    })
    
    // Footer
    y += 5
    doc.setDrawColor(139, 115, 85)
    doc.setLineWidth(0.5)
    doc.line(15, y, 195, y)
    y += 8
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100, 100, 100)
    doc.text(`Total: ${transactions.length} transaksi | Pemasukan: Rp ${formatRupiah(totalPemasukan)} | Pengeluaran: Rp ${formatRupiah(pengeluaran)}`, 105, y, { align: 'center' })
    
    doc.save('laporan-keuangan.pdf')
    showToast('PDF diunduh!', 'success')
  }

  // Generate student list PDF dengan TABEL BERNAMA
  const generateStudentPDF = async () => {
    if (!data) return
    
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    
    // Header dengan background coklat
    doc.setFillColor(139, 115, 85)
    doc.rect(0, 0, 210, 28, 'F')
    
    // Header title
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('DAFTAR MAHASISWA', 105, 12, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Total: ${data.students.length} Mahasiswa`, 105, 22, { align: 'center' })
    
    // Statistics
    const lunas = data.students.filter(s => s.status === 'lunas' || s.status === 'verified_g3').length
    const pending = data.students.filter(s => s.status.includes('pending')).length
    const belumBayar = data.students.filter(s => s.status === 'belum_bayar').length
    const totalDenda = data.students.reduce((a, b) => a + (b.denda || 0), 0)
    
    let y = 35
    doc.setTextColor(0, 0, 0)
    
    // TABEL STATISTIK - 4 kolom dengan warna
    const statColW = 45
    const statHeaders = ['Sudah Lunas', 'Pending', 'Belum Bayar', 'Total Denda']
    const statValues = [`${lunas}`, `${pending}`, `${belumBayar}`, `Rp ${formatRupiah(totalDenda)}`]
    const statColors: [number, number, number][] = [[80, 160, 80], [200, 160, 60], [150, 150, 150], [200, 100, 100]]
    
    doc.setFontSize(8)
    statHeaders.forEach((h, i) => {
      // Header cell dengan warna
      doc.setFillColor(...statColors[i])
      doc.rect(15 + i * statColW, y, statColW, 9, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.text(h, 15 + i * statColW + statColW/2, y + 4, { align: 'center' })
      
      // Value cell
      doc.setFillColor(255, 255, 255)
      doc.rect(15 + i * statColW, y + 9, statColW, 8, 'F')
      doc.setTextColor(60, 40, 20)
      doc.setFontSize(10)
      doc.text(statValues[i], 15 + i * statColW + statColW/2, y + 15, { align: 'center' })
    })
    
    y += 22
    
    // TABEL DATA MAHASISWA
    doc.setFillColor(139, 115, 85)
    doc.rect(15, y, 180, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('DATA MAHASISWA', 105, y + 5.5, { align: 'center' })
    y += 8
    
    // Table header
    const colWidths = [10, 30, 65, 45, 30]
    const headers = ['No', 'NIM', 'Nama Mahasiswa', 'Status', 'Denda']
    
    doc.setFillColor(200, 175, 150)
    doc.rect(15, y, 180, 8, 'F')
    doc.setTextColor(60, 40, 20)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    
    let xPos = 15
    headers.forEach((h, i) => {
      doc.text(h, xPos + colWidths[i]/2, y + 5.5, { align: 'center' })
      xPos += colWidths[i]
    })
    y += 8
    
    // Table rows
    doc.setFontSize(7)
    
    data.students.forEach((s, i) => {
      if (y > 275) {
        doc.addPage()
        y = 20
        // Repeat header
        doc.setFillColor(200, 175, 150)
        doc.rect(15, y, 180, 8, 'F')
        doc.setTextColor(60, 40, 20)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        xPos = 15
        headers.forEach((h, idx) => {
          doc.text(h, xPos + colWidths[idx]/2, y + 5.5, { align: 'center' })
          xPos += colWidths[idx]
        })
        y += 8
        doc.setFontSize(7)
      }
      
      // Row background berdasarkan status
      let bgColor: [number, number, number]
      if (s.status === 'lunas' || s.status === 'verified_g3') {
        bgColor = [220, 250, 220] // Hijau muda
      } else if (s.status.includes('pending')) {
        bgColor = [255, 250, 220] // Kuning muda
      } else if (s.status === 'rejected') {
        bgColor = [255, 230, 230] // Merah muda
      } else {
        bgColor = [250, 248, 245] // Abu-abu muda
      }
      
      doc.setFillColor(...bgColor)
      doc.rect(15, y, 180, 7, 'F')
      
      // Border bawah
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.1)
      doc.line(15, y + 7, 195, y + 7)
      
      // Status indicator bar di kiri
      let indicatorColor: [number, number, number]
      if (s.status === 'lunas' || s.status === 'verified_g3') {
        indicatorColor = [60, 160, 60]
      } else if (s.status.includes('pending')) {
        indicatorColor = [200, 160, 40]
      } else if (s.status === 'rejected') {
        indicatorColor = [200, 60, 60]
      } else {
        indicatorColor = [150, 150, 150]
      }
      doc.setFillColor(...indicatorColor)
      doc.rect(15, y, 2, 7, 'F')
      
      doc.setTextColor(40, 40, 40)
      doc.setFont('helvetica', 'normal')
      xPos = 15
      
      // No
      doc.text(`${i + 1}`, xPos + colWidths[0]/2, y + 5, { align: 'center' })
      xPos += colWidths[0]
      
      // NIM
      doc.text(s.nim, xPos + colWidths[1]/2, y + 5, { align: 'center' })
      xPos += colWidths[1]
      
      // Nama
      doc.text(s.nama.substring(0, 32), xPos + 2, y + 5)
      xPos += colWidths[2]
      
      // Status
      doc.setFontSize(6)
      const statusText = getStatusText(s.status)
      doc.text(statusText.substring(0, 20), xPos + colWidths[3]/2, y + 5, { align: 'center' })
      doc.setFontSize(7)
      xPos += colWidths[3]
      
      // Denda
      if (s.denda > 0) {
        doc.setTextColor(200, 50, 50)
        doc.setFont('helvetica', 'bold')
        doc.text(`Rp ${formatRupiah(s.denda)}`, xPos + colWidths[4]/2, y + 5, { align: 'center' })
        doc.setFont('helvetica', 'normal')
      } else {
        doc.setTextColor(120, 120, 120)
        doc.text('-', xPos + colWidths[4]/2, y + 5, { align: 'center' })
      }
      
      y += 7
    })
    
    // Footer
    y += 5
    doc.setDrawColor(139, 115, 85)
    doc.setLineWidth(0.5)
    doc.line(15, y, 195, y)
    y += 8
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100, 100, 100)
    doc.text(`Lunas: ${lunas} | Pending: ${pending} | Belum Bayar: ${belumBayar} | Total: ${data.students.length}`, 105, y, { align: 'center' })
    
    doc.save('daftar-mahasiswa.pdf')
    showToast('PDF diunduh!', 'success')
  }

  // Calculate time remaining
  const getTimeRemaining = (pendingSince: string | null | undefined) => {
    if (!pendingSince) return null
    
    const pendingTime = new Date(pendingSince).getTime()
    const now = new Date().getTime()
    const diff = 24 * 60 * 60 * 1000 - (now - pendingTime) // 24 hours
    
    if (diff <= 0) return 'Waktu habis, hubungi Bendahara'
    
    const hours = Math.floor(diff / (60 * 60 * 1000))
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))
    
    return `${hours} jam ${minutes} menit lagi`
  }

  // Format QRIS timer
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Start QRIS payment - Gunakan Midtrans jika sudah dikonfigurasi
  const startQRISPayment = () => {
    if (!data) return
    
    // Jika Midtrans sudah dikonfigurasi, gunakan Midtrans
    if (midtransConfig?.configured) {
      setPaymentMethod('qris')
      setQrisActive(true)
    } else {
      // Jika tidak, gunakan QRIS manual
      showDialog(
        'Pembayaran QRIS Manual 💳',
        'Anda yakin ingin membayar dengan QRIS? Scan QRIS dan kirim bukti pembayaran ke Bendahara.',
        'confirm',
        () => {
          setQrisActive(true)
          setQrisTimer(data.settings.qrisExpiryMinutes * 60)
          setPaymentMethod('qris')
        }
      )
    }
  }

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E8D4C4] to-[#D4B896] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-bounce mb-4">🏥</div>
          <p className="text-[#6B5344] text-xl font-medium">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8D4C4] to-[#D4B896] relative overflow-hidden">
      {/* Background emojis */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {['💊', '💉', '🩺', '🏥', '💗', '🧸', '🍭', '🎀'].map((emoji, i) => (
          <div
            key={i}
            className="absolute text-3xl opacity-20 animate-pulse"
            style={{
              left: `${10 + (i * 12)}%`,
              top: `${15 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      {/* Polka dots background */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, #C4A484 1px, transparent 1px)',
        backgroundSize: '30px 30px',
        opacity: 0.3
      }} />

      {/* LOGIN VIEW */}
      {view === 'login' && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/30">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[#6B5344] mb-2">🎀 Selamat Datang 🎀</h1>
              <p className="text-[#8B7355] text-sm">Sistem Pembayaran Uang Kas</p>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Username / NIM"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/60 border border-[#C4A484] focus:outline-none focus:ring-2 focus:ring-[#8B7355] text-[#6B5344] placeholder-[#A89070]"
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/60 border border-[#C4A484] focus:outline-none focus:ring-2 focus:ring-[#8B7355] text-[#6B5344] placeholder-[#A89070]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B7355] hover:text-[#6B5344] p-1"
                >
                  {showPassword ? <EyeCloseIcon /> : <EyeOpenIcon />}
                </button>
              </div>

              <button
                onClick={handleLogin}
                className="w-full py-3 bg-gradient-to-r from-[#C4A484] to-[#8B7355] text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg"
              >
                Masuk
              </button>

              <div className="text-center">
                <button
                  onClick={() => setLupaPasswordDialog(true)}
                  className="text-[#8B7355] hover:text-[#6B5344] text-sm underline"
                >
                  Lupa password?
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT DASHBOARD */}
      {view === 'student' && currentUser && 'nim' in currentUser && data && (
        <div className="min-h-screen">
          {/* Mobile header */}
          <div className="lg:hidden fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg z-40 px-4 py-3 flex justify-between items-center border-b border-[#C4A484]/30">
            <button onClick={() => setSidebarOpen(true)} className="text-[#6B5344]">
              <MenuIcon />
            </button>
            <span className="font-semibold text-[#6B5344]">Dashboard Mahasiswa</span>
            <button onClick={handleLogout} className="text-[#6B5344]">
              <LogoutIcon />
            </button>
          </div>

          {/* Sidebar overlay */}
          {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
          )}

          {/* Sidebar */}
          <div className={`fixed top-0 left-0 h-full w-64 bg-white/90 backdrop-blur-xl z-50 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 border-r border-[#C4A484]/30`}>
            <div className="p-4 border-b border-[#C4A484]/30 flex justify-between items-center">
              <h2 className="font-bold text-[#6B5344]">Menu</h2>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-[#6B5344]">
                <CloseIcon />
              </button>
            </div>

            <div className="p-4">
              <button
                onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false) }}
                className={`w-full text-left px-4 py-3 rounded-xl mb-2 transition-all ${activeTab === 'dashboard' ? 'bg-[#C4A484] text-white' : 'text-[#6B5344] hover:bg-[#E8D4C4]'}`}
              >
                🏠 Dashboard
              </button>
              <button
                onClick={() => { setActiveTab('pengumuman'); setSidebarOpen(false) }}
                className={`w-full text-left px-4 py-3 rounded-xl mb-2 transition-all ${activeTab === 'pengumuman' ? 'bg-[#C4A484] text-white' : 'text-[#6B5344] hover:bg-[#E8D4C4]'}`}
              >
                📢 Pengumuman
              </button>
              <button
                onClick={() => { setActiveTab('pengaduan'); setSidebarOpen(false) }}
                className={`w-full text-left px-4 py-3 rounded-xl mb-2 transition-all ${activeTab === 'pengaduan' ? 'bg-[#C4A484] text-white' : 'text-[#6B5344] hover:bg-[#E8D4C4]'}`}
              >
                💬 Pengaduan
              </button>
            </div>

            <div className="absolute bottom-4 left-4 right-4 hidden lg:block">
              <button
                onClick={handleLogout}
                className="w-full py-3 bg-red-400/80 text-white rounded-xl font-medium hover:bg-red-500 transition-all flex items-center justify-center gap-2"
              >
                <LogoutIcon /> Keluar
              </button>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:ml-64 pt-16 lg:pt-0">
            {/* Desktop header */}
            <div className="hidden lg:flex justify-between items-center p-6 bg-white/50 backdrop-blur-lg border-b border-[#C4A484]/30">
              <h1 className="text-2xl font-bold text-[#6B5344]">Dashboard Mahasiswa</h1>
              <div className="flex items-center gap-3">
                {/* Notification Toggle */}
                <button
                  onClick={toggleNotifications}
                  className={`p-2 rounded-xl transition-all ${
                    notificationPermission === 'granted' && notificationEnabled
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : notificationPermission === 'denied'
                        ? 'bg-red-100 text-red-400'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                  title={
                    notificationPermission === 'denied'
                      ? 'Notifikasi diblokir browser'
                      : notificationEnabled
                        ? 'Nonaktifkan notifikasi'
                        : 'Aktifkan notifikasi'
                  }
                >
                  {notificationPermission === 'granted' && notificationEnabled ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                      <line x1="12" y1="2" x2="12" y2="12"></line>
                    </svg>
                  )}
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-400/80 text-white rounded-xl font-medium hover:bg-red-500 transition-all flex items-center gap-2"
                >
                  <LogoutIcon /> Keluar
                </button>
              </div>
            </div>

            <div className="p-4 lg:p-6">
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Profile Card */}
                  <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/50">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="relative">
                        <div
                          className="text-6xl cursor-pointer hover:scale-110 transition-transform"
                          onClick={() => setShowAvatarPicker(true)}
                          title="Klik untuk ganti avatar"
                        >
                          {(currentUser as Student).avatar}
                        </div>
                        <button
                          onClick={() => setShowAvatarPicker(true)}
                          className="absolute -bottom-1 -right-1 bg-[#C4A484] text-white text-xs px-2 py-1 rounded-full"
                        >
                          Ganti
                        </button>
                      </div>

                      <div className="flex-1 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          {editNama ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newNama}
                                onChange={(e) => setNewNama(e.target.value.toUpperCase())}
                                className="px-3 py-1 rounded-lg border border-[#C4A484] bg-white/80 text-[#6B5344]"
                              />
                              <button
                                onClick={handleUpdateNama}
                                className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm"
                              >
                                Simpan
                              </button>
                              <button
                                onClick={() => { setEditNama(false); setNewNama('') }}
                                className="px-3 py-1 bg-gray-400 text-white rounded-lg text-sm"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <>
                              <h2 className="text-xl font-bold text-[#6B5344]">{(currentUser as Student).nama}</h2>
                              <button
                                onClick={() => { setEditNama(true); setNewNama((currentUser as Student).nama) }}
                                className="text-[#8B7355] hover:text-[#6B5344]"
                              >
                                <EditIcon />
                              </button>
                            </>
                          )}
                        </div>
                        <p className="text-[#8B7355]">NIM: {(currentUser as Student).nim}</p>

                        <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                          <span className="text-[#8B7355]">Password:</span>
                          {editPassword ? (
                            <div className="flex gap-2">
                              <div className="relative">
                                <input
                                  type={showStudentPassword ? 'text' : 'password'}
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  className="px-3 py-1 pr-10 rounded-lg border border-[#C4A484] bg-white/80 text-[#6B5344]"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowStudentPassword(!showStudentPassword)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8B7355]"
                                >
                                  {showStudentPassword ? <EyeCloseIcon /> : <EyeOpenIcon />}
                                </button>
                              </div>
                              <button
                                onClick={handleUpdatePassword}
                                className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm"
                              >
                                Simpan
                              </button>
                              <button
                                onClick={() => { setEditPassword(false); setNewPassword('') }}
                                className="px-3 py-1 bg-gray-400 text-white rounded-lg text-sm"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="text-[#6B5344]">••••••••</span>
                              <button
                                onClick={() => { setEditPassword(true); setNewPassword('') }}
                                className="text-[#8B7355] hover:text-[#6B5344]"
                              >
                                <EditIcon />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Card */}
                  <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/50">
                    <h3 className="text-lg font-bold text-[#6B5344] mb-4">📊 Status Pembayaran</h3>
                    
                    <div className={`p-4 rounded-xl ${(() => {
                      const status = (currentUser as Student).status
                      if (status === 'lunas' || status === 'verified_g3') return 'bg-green-100 border border-green-300'
                      if (status.includes('pending')) return 'bg-yellow-100 border border-yellow-300'
                      if ((currentUser as Student).rejectionReason) return 'bg-red-100 border border-red-300'
                      return 'bg-[#F5E6D3] border border-[#C4A484]'
                    })()}`}>
                      <p className="font-semibold text-[#6B5344]">{getStatusText((currentUser as Student).status)}</p>
                      
                      {(currentUser as Student).status.includes('pending') && (currentUser as Student).pendingSince && (
                        <div className="mt-2 text-sm text-[#8B7355]">
                          <p>⏰ {getTimeRemaining((currentUser as Student).pendingSince)}</p>
                          <p className="text-xs mt-1">Jika belum diverifikasi dalam 1x24 jam, hubungi Bendahara</p>
                        </div>
                      )}

                      {(currentUser as Student).rejectionReason && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                          <p className="font-medium text-red-700 text-sm">❌ Pembayaran Ditolak:</p>
                          <p className="text-red-600 text-sm mt-1">{(currentUser as Student).rejectionReason}</p>
                          <p className="text-red-500 text-xs mt-2">Mohon lakukan pembayaran ulang dan kirim bukti pembayaran ke Bendahara. Terima kasih.</p>
                        </div>
                      )}
                    </div>

                    {/* Denda info */}
                    {(currentUser as Student).denda > 0 && (
                      <div className="mt-4 p-4 rounded-xl bg-red-100 border border-red-300">
                        <p className="font-semibold text-red-600">⚠️ Denda: Rp {formatRupiah((currentUser as Student).denda)}</p>
                        <p className="text-sm text-red-500 mt-1">Harap lunasi denda terlebih dahulu sebelum membayar kas.</p>
                      </div>
                    )}

                    {/* Lunas message */}
                    {((currentUser as Student).status === 'lunas' || (currentUser as Student).status === 'verified_g3') && (
                      <div className="mt-4 p-4 rounded-xl bg-green-100 border border-green-300 text-center">
                        <p className="text-green-600 font-medium">🎉 Selamat! Tidak ada tagihan kas / Sudah LUNAS, Terima kasih! 🎉</p>
                      </div>
                    )}

                    {/* Lihat Struk Button - Show when has lastPayment */}
                    {((currentUser as Student).lastPayment || (currentUser as Student).status.includes('pending') || (currentUser as Student).status === 'lunas' || (currentUser as Student).status === 'verified_g3') && (
                      <button
                        onClick={() => {
                          const student = currentUser as Student
                          if (student.lastPayment) {
                            setReceiptData({
                              nama: student.nama,
                              nim: student.nim,
                              nominal: student.lastPayment.amount,
                              paymentType: student.lastPayment.paymentType,
                              date: student.lastPayment.date,
                              time: student.lastPayment.time,
                              method: student.lastPayment.method
                            })
                            setShowReceiptDialog(true)
                          } else {
                            showToast('Struk pembayaran belum tersedia', 'info')
                          }
                        }}
                        className="w-full mt-4 py-3 bg-gradient-to-r from-[#8B7355] to-[#6B5344] text-white rounded-xl font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
                      >
                        🧾 Lihat Struk Pembayaran
                      </button>
                    )}
                  </div>

                  {/* Payment Section - Show if not lunas and not pending */}
                  {/* Also show if has rejection reason */}
                  {((currentUser as Student).status !== 'lunas' && 
                    (currentUser as Student).status !== 'verified_g3' && 
                    (!(currentUser as Student).status.includes('pending') || (currentUser as Student).rejectionReason)) && (
                    <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/50">
                      <h3 className="text-lg font-bold text-[#6B5344] mb-4">💳 Pembayaran</h3>

                      {/* Payment method selection */}
                      {!paymentMethod && (
                        <div className="space-y-4">
                          {(currentUser as Student).denda > 0 ? (
                            <button
                              onClick={() => setPaymentMethod('transfer')}
                              className="w-full py-4 bg-gradient-to-r from-[#C4A484] to-[#8B7355] text-white rounded-xl font-semibold hover:opacity-90 transition-all"
                            >
                              Bayar Denda Rp {formatRupiah((currentUser as Student).denda)}
                            </button>
                          ) : (
                            <>
                              <p className="text-[#6B5344] font-medium">Pilih metode pembayaran:</p>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                  onClick={() => setPaymentMethod('transfer')}
                                  className="p-4 bg-[#F5E6D3] rounded-xl text-[#6B5344] font-medium hover:bg-[#E8D4C4] transition-all border border-[#C4A484]"
                                >
                                  🏦 Transfer Bank/DANA
                                </button>
                                <button
                                  onClick={startQRISPayment}
                                  className="p-4 bg-[#F5E6D3] rounded-xl text-[#6B5344] font-medium hover:bg-[#E8D4C4] transition-all border border-[#C4A484]"
                                >
                                  📱 QRIS
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Transfer payment */}
                      {paymentMethod === 'transfer' && !selectedBank && (
                        <div className="space-y-4">
                          <p className="text-[#6B5344] font-medium">Pilih bank/e-wallet:</p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                              onClick={() => setSelectedBank('jago')}
                              className="p-4 bg-[#F5E6D3] rounded-xl text-[#6B5344] font-medium hover:bg-[#E8D4C4] transition-all border border-[#C4A484]"
                            >
                              🏦 Bank Jago
                            </button>
                            <button
                              onClick={() => setSelectedBank('dana')}
                              className="p-4 bg-[#F5E6D3] rounded-xl text-[#6B5344] font-medium hover:bg-[#E8D4C4] transition-all border border-[#C4A484]"
                            >
                              👛 DANA
                            </button>
                          </div>
                          
                          <button
                            onClick={() => setPaymentMethod(null)}
                            className="w-full py-2 text-[#8B7355] hover:text-[#6B5344]"
                          >
                            ← Kembali
                          </button>
                        </div>
                      )}

                      {/* Bank details and payment wave selection */}
                      {paymentMethod === 'transfer' && selectedBank && (
                        <div className="space-y-4">
                          <div className="p-4 bg-[#F5E6D3] rounded-xl">
                            <p className="font-medium text-[#6B5344]">
                              {selectedBank === 'jago' ? '🏦 Bank Jago' : '👛 DANA'}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <code className="text-lg font-mono text-[#6B5344]">
                                {selectedBank === 'jago' ? '105156660257' : '085117455265'}
                              </code>
                              <button
                                onClick={() => copyToClipboard(selectedBank === 'jago' ? '105156660257' : '085117455265')}
                                className="p-1 text-[#8B7355] hover:text-[#6B5344]"
                              >
                                📋
                              </button>
                            </div>
                            <p className="text-sm text-[#8B7355] mt-1">a.n M. FAZA NURULLOH BADRUZ ZAMAN</p>
                          </div>

                          {/* Payment amount and wave selection */}
                          {(currentUser as Student).denda > 0 ? (
                            <div className="p-4 bg-[#F5E6D3] rounded-xl">
                              <p className="font-medium text-[#6B5344]">Nominal: Rp {formatRupiah((currentUser as Student).denda)}</p>
                              <p className="text-sm text-[#8B7355]">Status: Pelunasan Denda</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <p className="font-medium text-[#6B5344]">Pilih pembayaran:</p>
                              
                              {/* Show available waves */}
                              {((currentUser as Student).status === 'belum_bayar' || (currentUser as Student).status === 'rejected') && (
                                <>
                                  <button
                                    onClick={() => setPaymentWave('g1')}
                                    className={`w-full p-4 rounded-xl text-left transition-all border-2 ${paymentWave === 'g1' ? 'bg-[#C4A484] text-white border-[#8B7355]' : 'bg-[#F5E6D3] text-[#6B5344] border-[#C4A484] hover:bg-[#E8D4C4]'}`}
                                  >
                                    <p className="font-medium">🌊 Gelombang 1</p>
                                    <p className="text-sm">Rp {formatRupiah(data.settings.gelombang1Nominal)}</p>
                                  </button>
                                  <button
                                    onClick={() => setPaymentWave('lunas')}
                                    className={`w-full p-4 rounded-xl text-left transition-all border-2 ${paymentWave === 'lunas' ? 'bg-green-600 text-white border-green-700' : 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'}`}
                                  >
                                    <p className="font-medium">✨ Langsung Lunas</p>
                                    <p className="text-sm">Rp {formatRupiah(data.settings.langsungLunasNominal)}</p>
                                  </button>
                                </>
                              )}
                              
                              {(currentUser as Student).status === 'verified_g1' && (
                                <button
                                  onClick={() => setPaymentWave('g2')}
                                  className={`w-full p-4 rounded-xl text-left transition-all border-2 ${paymentWave === 'g2' ? 'bg-[#C4A484] text-white border-[#8B7355]' : 'bg-[#F5E6D3] text-[#6B5344] border-[#C4A484] hover:bg-[#E8D4C4]'}`}
                                >
                                  <p className="font-medium">🌊 Gelombang 2</p>
                                  <p className="text-sm">Rp {formatRupiah(data.settings.gelombang2Nominal)}</p>
                                </button>
                              )}
                              
                              {(currentUser as Student).status === 'verified_g2' && (
                                <button
                                  onClick={() => setPaymentWave('g3')}
                                  className={`w-full p-4 rounded-xl text-left transition-all border-2 ${paymentWave === 'g3' ? 'bg-[#C4A484] text-white border-[#8B7355]' : 'bg-[#F5E6D3] text-[#6B5344] border-[#C4A484] hover:bg-[#E8D4C4]'}`}
                                >
                                  <p className="font-medium">🌊 Gelombang 3</p>
                                  <p className="text-sm">Rp {formatRupiah(data.settings.gelombang3Nominal)}</p>
                                </button>
                              )}
                            </div>
                          )}

                          {/* Payment guide */}
                          <div className="p-4 bg-white/50 rounded-xl border border-[#C4A484]/30">
                            <p className="font-medium text-[#6B5344] mb-2">📋 Tata Cara Pembayaran:</p>
                            <ol className="text-sm text-[#8B7355] space-y-1 list-decimal list-inside">
                              <li>Pilih metode pembayaran (Transfer Bank Jago / DANA).</li>
                              <li>Klik tombol "📋" untuk menyalin nomor rekening.</li>
                              <li>Lakukan transfer sesuai nominal yang tertera.</li>
                              <li>Kembali ke halaman ini, lalu klik tombol "Konfirmasi Bayar".</li>
                              <li>Sistem akan otomatis membuka WhatsApp dengan format pesan.</li>
                              <li>Kirim pesan tersebut ke Bendahara. Tunggu verifikasi.</li>
                            </ol>
                          </div>

                          {/* Confirm button */}
                          {((currentUser as Student).denda > 0 || paymentWave) && (
                            <button
                              onClick={handleConfirmPayment}
                              className="w-full py-4 bg-gradient-to-r from-[#C4A484] to-[#8B7355] text-white rounded-xl font-semibold hover:opacity-90 transition-all"
                            >
                              Konfirmasi Bayar
                            </button>
                          )}

                          <button
                            onClick={() => { setSelectedBank(null); setPaymentWave(null) }}
                            className="w-full py-2 text-[#8B7355] hover:text-[#6B5344]"
                          >
                            ← Kembali
                          </button>
                        </div>
                      )}

                      {/* QRIS payment */}
                      {paymentMethod === 'qris' && qrisActive && (
                        <div className="space-y-4">
                          {/* Jika Midtrans dikonfigurasi, tampilkan pilihan Midtrans */}
                          {midtransConfig?.configured ? (
                            <>
                              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-2xl">💳</span>
                                  <p className="font-bold text-blue-700">Pembayaran QRIS Otomatis</p>
                                </div>
                                <p className="text-sm text-blue-600">
                                  Pembayaran akan otomatis terverifikasi setelah sukses. 
                                  <span className="text-xs block mt-1 text-blue-500">Biaya admin: 0.7% (ditanggung pembayar)</span>
                                  <span className="text-xs block mt-1 text-orange-500 font-medium">⚠️ Minimal Rp 10.000 untuk QRIS otomatis</span>
                                </p>
                              </div>

                              {/* Wave selection for QRIS */}
                              {(currentUser as Student).denda <= 0 && (
                                <div className="space-y-3">
                                  <p className="font-medium text-[#6B5344]">Pilih pembayaran:</p>
                                  
                                  {((currentUser as Student).status === 'belum_bayar' || (currentUser as Student).status === 'rejected') && (
                                    <>
                                      <button
                                        onClick={() => setPaymentWave('g1')}
                                        className={`w-full p-4 rounded-xl text-left transition-all border-2 ${paymentWave === 'g1' ? 'bg-[#C4A484] text-white border-[#8B7355]' : 'bg-[#F5E6D3] text-[#6B5344] border-[#C4A484] hover:bg-[#E8D4C4]'}`}
                                      >
                                        <p className="font-medium">🌊 Gelombang 1</p>
                                        <p className="text-sm">
                                          Rp {formatRupiah(data.settings.gelombang1Nominal)}
                                          {data.settings.gelombang1Nominal >= 10000 ? (
                                            <span className="text-xs opacity-70"> + Rp {formatRupiah(Math.ceil(data.settings.gelombang1Nominal * 0.007))} admin</span>
                                          ) : (
                                            <span className="text-xs text-red-500"> ⚠️ Di bawah minimum, pakai QRIS Manual</span>
                                          )}
                                        </p>
                                      </button>
                                      <button
                                        onClick={() => setPaymentWave('lunas')}
                                        className={`w-full p-4 rounded-xl text-left transition-all border-2 ${paymentWave === 'lunas' ? 'bg-green-600 text-white border-green-700' : 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'}`}
                                      >
                                        <p className="font-medium">✨ Langsung Lunas</p>
                                        <p className="text-sm">Rp {formatRupiah(data.settings.langsungLunasNominal)} <span className="text-xs opacity-70">+ Rp {formatRupiah(Math.ceil(data.settings.langsungLunasNominal * 0.007))} admin</span></p>
                                      </button>
                                    </>
                                  )}
                                  
                                  {(currentUser as Student).status === 'verified_g1' && (
                                    <button
                                      onClick={() => setPaymentWave('g2')}
                                      className={`w-full p-4 rounded-xl text-left transition-all border-2 ${paymentWave === 'g2' ? 'bg-[#C4A484] text-white border-[#8B7355]' : 'bg-[#F5E6D3] text-[#6B5344] border-[#C4A484] hover:bg-[#E8D4C4]'}`}
                                    >
                                      <p className="font-medium">🌊 Gelombang 2</p>
                                      <p className="text-sm">Rp {formatRupiah(data.settings.gelombang2Nominal)} <span className="text-xs opacity-70">+ Rp {formatRupiah(Math.ceil(data.settings.gelombang2Nominal * 0.007))} admin</span></p>
                                    </button>
                                  )}
                                  
                                  {(currentUser as Student).status === 'verified_g2' && (
                                    <button
                                      onClick={() => setPaymentWave('g3')}
                                      className={`w-full p-4 rounded-xl text-left transition-all border-2 ${paymentWave === 'g3' ? 'bg-[#C4A484] text-white border-[#8B7355]' : 'bg-[#F5E6D3] text-[#6B5344] border-[#C4A484] hover:bg-[#E8D4C4]'}`}
                                    >
                                      <p className="font-medium">🌊 Gelombang 3</p>
                                      <p className="text-sm">Rp {formatRupiah(data.settings.gelombang3Nominal)} <span className="text-xs opacity-70">+ Rp {formatRupiah(Math.ceil(data.settings.gelombang3Nominal * 0.007))} admin</span></p>
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* Pay button for Midtrans */}
                              {((currentUser as Student).denda > 0 || paymentWave) && (
                                <>
                                  {/* Check if amount is >= 10000 for QRIS Otomatis */}
                                  {(() => {
                                    const student = currentUser as Student
                                    let amount = 0
                                    if (student.denda > 0) amount = student.denda
                                    else if (paymentWave === 'lunas') amount = data.settings.langsungLunasNominal
                                    else if (paymentWave === 'g1') amount = data.settings.gelombang1Nominal
                                    else if (paymentWave === 'g2') amount = data.settings.gelombang2Nominal
                                    else if (paymentWave === 'g3') amount = data.settings.gelombang3Nominal
                                    
                                    return amount >= 10000 ? (
                                      <button
                                        onClick={() => {
                                          let amt = 0
                                          let pType = ''
                                          
                                          if (student.denda > 0) {
                                            amt = student.denda
                                            pType = 'Denda'
                                          } else if (paymentWave === 'lunas') {
                                            amt = data.settings.langsungLunasNominal
                                            pType = 'Langsung Lunas'
                                          } else if (paymentWave === 'g1') {
                                            amt = data.settings.gelombang1Nominal
                                            pType = 'Gelombang 1'
                                          } else if (paymentWave === 'g2') {
                                            amt = data.settings.gelombang2Nominal
                                            pType = 'Gelombang 2'
                                          } else if (paymentWave === 'g3') {
                                            amt = data.settings.gelombang3Nominal
                                            pType = 'Gelombang 3'
                                          }
                                          
                                          if (amt > 0) {
                                            payWithMidtrans(amt, pType)
                                          }
                                        }}
                                        disabled={midtransLoading}
                                        className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                                      >
                                        {midtransLoading ? '⏳ Memproses...' : '💳 Bayar dengan QRIS Otomatis'}
                                      </button>
                                    ) : (
                                      <div className="space-y-3">
                                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700">
                                          ⚠️ Nominal di bawah Rp 10.000 tidak bisa pakai QRIS Otomatis. Silakan gunakan QRIS Manual.
                                        </div>
                                        <button
                                          onClick={handleConfirmPayment}
                                          className="w-full py-4 bg-gradient-to-r from-[#C4A484] to-[#8B7355] text-white rounded-xl font-semibold hover:opacity-90 transition-all"
                                        >
                                          📱 Gunakan QRIS Manual
                                        </button>
                                      </div>
                                    )
                                  })()}
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              {/* QRIS Manual - Jika Midtrans tidak dikonfigurasi */}
                              <div className="p-4 bg-[#F5E6D3] rounded-xl text-center">
                                <p className="font-medium text-[#6B5344] mb-2">QRIS Manual</p>
                                <div className="inline-block p-2 bg-white rounded-lg">
                                  <img src="/qris.png" alt="QRIS" className="max-w-full h-auto" style={{ maxHeight: '200px' }} />
                                </div>
                                <div className="mt-3 flex justify-center gap-2">
                                  <button
                                    onClick={downloadQRIS}
                                    className="px-4 py-2 bg-[#C4A484] text-white rounded-lg text-sm flex items-center gap-2"
                                  >
                                    <DownloadIcon /> Download QRIS
                                  </button>
                                </div>
                              </div>

                              {/* Timer */}
                              <div className={`p-4 rounded-xl text-center ${qrisTimer && qrisTimer > 300 ? 'bg-green-100' : qrisTimer && qrisTimer > 60 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                                <p className="font-medium text-[#6B5344]">⏰ Waktu tersisa:</p>
                                <p className="text-2xl font-bold text-[#6B5344]">
                                  {qrisTimer !== null ? formatTimer(qrisTimer) : '00:00'}
                                </p>
                              </div>

                              {/* Wave selection for QRIS */}
                              {(currentUser as Student).denda <= 0 && (
                                <div className="space-y-3">
                                  <p className="font-medium text-[#6B5344]">Pilih pembayaran:</p>
                                  
                                  {((currentUser as Student).status === 'belum_bayar' || (currentUser as Student).status === 'rejected') && (
                                    <>
                                      <button
                                        onClick={() => setPaymentWave('g1')}
                                        className={`w-full p-4 rounded-xl text-left transition-all border-2 ${paymentWave === 'g1' ? 'bg-[#C4A484] text-white border-[#8B7355]' : 'bg-[#F5E6D3] text-[#6B5344] border-[#C4A484] hover:bg-[#E8D4C4]'}`}
                                      >
                                        <p className="font-medium">🌊 Gelombang 1</p>
                                        <p className="text-sm">Rp {formatRupiah(data.settings.gelombang1Nominal)}</p>
                                      </button>
                                      <button
                                        onClick={() => setPaymentWave('lunas')}
                                        className={`w-full p-4 rounded-xl text-left transition-all border-2 ${paymentWave === 'lunas' ? 'bg-green-600 text-white border-green-700' : 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'}`}
                                      >
                                        <p className="font-medium">✨ Langsung Lunas</p>
                                        <p className="text-sm">Rp {formatRupiah(data.settings.langsungLunasNominal)}</p>
                                      </button>
                                    </>
                                  )}
                                  
                                  {(currentUser as Student).status === 'verified_g1' && (
                                    <button
                                      onClick={() => setPaymentWave('g2')}
                                      className={`w-full p-4 rounded-xl text-left transition-all border-2 ${paymentWave === 'g2' ? 'bg-[#C4A484] text-white border-[#8B7355]' : 'bg-[#F5E6D3] text-[#6B5344] border-[#C4A484] hover:bg-[#E8D4C4]'}`}
                                    >
                                      <p className="font-medium">🌊 Gelombang 2</p>
                                      <p className="text-sm">Rp {formatRupiah(data.settings.gelombang2Nominal)}</p>
                                    </button>
                                  )}
                                  
                                  {(currentUser as Student).status === 'verified_g2' && (
                                    <button
                                      onClick={() => setPaymentWave('g3')}
                                      className={`w-full p-4 rounded-xl text-left transition-all border-2 ${paymentWave === 'g3' ? 'bg-[#C4A484] text-white border-[#8B7355]' : 'bg-[#F5E6D3] text-[#6B5344] border-[#C4A484] hover:bg-[#E8D4C4]'}`}
                                    >
                                      <p className="font-medium">🌊 Gelombang 3</p>
                                      <p className="text-sm">Rp {formatRupiah(data.settings.gelombang3Nominal)}</p>
                                    </button>
                                  )}
                                </div>
                              )}

                              {((currentUser as Student).denda > 0 || paymentWave) && (
                                <button
                                  onClick={handleConfirmPayment}
                                  className="w-full py-4 bg-gradient-to-r from-[#C4A484] to-[#8B7355] text-white rounded-xl font-semibold hover:opacity-90 transition-all"
                                >
                                  Konfirmasi Bayar
                                </button>
                              )}
                            </>
                          )}

                          <button
                            onClick={() => { setPaymentMethod(null); setQrisActive(false); setQrisTimer(null); setPaymentWave(null) }}
                            className="w-full py-2 text-[#8B7355] hover:text-[#6B5344]"
                          >
                            ← Batalkan
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Pengumuman Tab - WhatsApp Style */}
              {activeTab === 'pengumuman' && (
                <div className="bg-[#E5DDD5] rounded-2xl shadow-lg overflow-hidden flex flex-col h-[600px]">
                  {/* Header */}
                  <div className="bg-[#075E54] text-white p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl overflow-hidden">
                      {data.settings.groupAvatarUrl ? (
                        <img src={data.settings.groupAvatarUrl} alt="Group" className="w-full h-full object-cover" />
                      ) : (
                        data.settings.groupAvatar || '👥'
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold">{data.settings.groupName || 'Grup Kas Kelas'}</h3>
                      <p className="text-xs text-white/70">{data.students.length} anggota • {data.announcements.length} pesan</p>
                    </div>
                  </div>

                  {/* Pinned announcement - WhatsApp style */}
                  {data.announcements.filter(a => a.pinned).length > 0 && (
                    <div 
                      className="bg-[#DCF8C6] border-b border-[#25D366]/20 p-2 cursor-pointer hover:bg-[#d0f0b0] transition-colors"
                      onClick={() => setViewPinnedMessage(true)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#075E54]">📌</span>
                        <span className="text-xs text-[#075E54] font-medium">Pesan Disematkan</span>
                        <span className="text-xs text-[#075E54]/60 ml-auto">Klik untuk lihat</span>
                      </div>
                      {data.announcements.filter(a => a.pinned).slice(0, 1).map(a => (
                        <div key={a.id} className="bg-white/80 p-2 rounded-lg text-sm">
                          <p className="font-medium text-[#075E54]">{a.sender} {a.senderType === 'bendahara' && '👑'}</p>
                          <p className="text-[#303030] truncate">{a.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Messages list - WhatsApp style */}
                  <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#E5DDD5]" style={{
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
                  }}>
                    {data.announcements.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-[#667781] text-center">Belum ada pesan</p>
                      </div>
                    ) : (
                      <>
                        {data.announcements.map(a => {
                          const isOwnMessage = a.senderNim === (currentUser as Student).nim
                          const isSelected = selectedMessageId === a.id
                          const isHighlighted = highlightedMessageId === a.id
                          const reactions = a.reactions || []

                          return (
                          <div key={a.id} id={`message-${a.id}`} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[80%] ${isOwnMessage ? 'bg-[#DCF8C6]' : 'bg-white'} ${isHighlighted ? 'ring-2 ring-[#075E54] ring-offset-2 animate-pulse' : ''} rounded-lg shadow-sm relative cursor-pointer transition-all`}
                              onClick={() => setSelectedMessageId(isSelected ? null : a.id)}
                            >
                              {/* Sender name */}
                              {!isOwnMessage && (
                                <p className="text-xs font-bold text-[#075E54] px-3 pt-2 pb-1">
                                  {a.sender} {a.senderType === 'bendahara' && '👑'}
                                </p>
                              )}
                              
                              {/* Edit mode */}
                              {editAnnouncementId === a.id ? (
                                <div className="p-2 space-y-2">
                                  <textarea
                                    value={editAnnouncementMessage}
                                    onChange={(e) => setEditAnnouncementMessage(e.target.value)}
                                    className="w-full p-2 rounded border border-[#075E54]/30 bg-white text-[#303030] text-sm"
                                    rows={2}
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleSaveEditAnnouncement() }}
                                      className="px-3 py-1 bg-[#075E54] text-white rounded text-sm"
                                    >
                                      Simpan
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setEditAnnouncementId(null) }}
                                      className="px-3 py-1 bg-gray-300 text-[#303030] rounded text-sm"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {/* Reply indicator in message */}
                                  {a.replyTo && (
                                    <div
                                      className="mx-3 mt-2 px-2 py-1 bg-gray-100/80 rounded border-l-2 border-[#075E54] cursor-pointer hover:bg-gray-200/80 transition-colors"
                                      onClick={(e) => { e.stopPropagation(); scrollToMessage(a.replyTo!.id) }}
                                    >
                                      <p className="text-xs font-medium text-[#075E54]">{a.replyTo.sender}</p>
                                      <p className="text-xs text-gray-500 truncate">{a.replyTo.message}</p>
                                    </div>
                                  )}
                                  <div className="px-3 pb-2">
                                    <p className="text-[#303030] text-sm whitespace-pre-wrap">{a.message}</p>
                                    <p className={`text-[10px] text-[#667781] text-right mt-1 flex items-center justify-end gap-1`}>
                                      {a.timestamp}
                                      {isOwnMessage && <span className="text-[#53BDEB]">✓✓</span>}
                                    </p>
                                  </div>
                                  
                                  {/* Reactions */}
                                  {reactions.length > 0 && (
                                    <div className="flex flex-wrap gap-1 px-2 pb-1">
                                      {Object.entries(reactions.reduce((acc, r) => {
                                        acc[r.emoji] = (acc[r.emoji] || 0) + 1
                                        return acc
                                      }, {} as Record<string, number>)).map(([emoji, count]) => (
                                        <span key={emoji} className="bg-white/80 px-1.5 py-0.5 rounded-full text-xs border border-gray-200">
                                          {emoji} {count}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Reaction picker */}
                                  {showReactionPicker === a.id && (
                                    <div className="absolute bottom-full left-0 mb-1 bg-white rounded-lg shadow-lg p-2 flex gap-1 z-10" onClick={(e) => e.stopPropagation()}>
                                      {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                        <button
                                          key={emoji}
                                          onClick={(e) => { e.stopPropagation(); handleAddReaction(a.id, emoji) }}
                                          className="text-lg hover:scale-125 transition-transform"
                                        >
                                          {emoji}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Message actions - HANYA muncul saat pesan diklik */}
                                  {isSelected && (
                                    <div className="flex gap-1 px-2 pb-2 pt-1 border-t border-gray-200">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setReplyTo({ id: a.id, sender: a.sender, message: a.message }); setSelectedMessageId(null) }}
                                        className="flex-1 text-[#667781] hover:text-[#075E54] p-1.5 bg-white/60 rounded text-xs flex items-center justify-center gap-1 font-medium"
                                      >
                                        ↩️ Balas
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setShowReactionPicker(showReactionPicker === a.id ? null : a.id) }}
                                        className="flex-1 text-[#667781] hover:text-[#075E54] p-1.5 bg-white/60 rounded text-xs flex items-center justify-center gap-1 font-medium"
                                      >
                                        😀 React
                                      </button>
                                      {isOwnMessage && (
                                        <>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleEditAnnouncement(a.id, a.message) }}
                                            className="flex-1 text-[#667781] hover:text-[#075E54] p-1.5 bg-white/60 rounded text-xs flex items-center justify-center gap-1 font-medium"
                                          >
                                            <EditIcon /> Edit
                                          </button>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteAnnouncement(a.id) }}
                                            className="flex-1 text-red-500 hover:text-red-700 p-1.5 bg-white/60 rounded text-xs flex items-center justify-center gap-1 font-medium"
                                          >
                                            <TrashIcon /> Hapus
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )
                        })}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Message input - WhatsApp style */}
                  <div className="bg-[#F0F0F0] p-3">
                    {data.settings.announcementActive === false ? (
                      <div className="text-center py-2 text-gray-500 text-sm">
                        🚫 Pengumuman dinonaktifkan oleh Bendahara
                      </div>
                    ) : (
                      <>
                        {/* Reply indicator */}
                        {replyTo && (
                          <div className="flex items-center gap-2 mb-2 px-2 py-1 bg-[#075E54]/10 rounded-lg">
                            <div className="w-1 h-8 bg-[#075E54] rounded-full"></div>
                            <div className="flex-1">
                              <p className="text-xs font-medium text-[#075E54]">Membalas {replyTo.sender}</p>
                              <p className="text-xs text-gray-500 truncate">{replyTo.message}</p>
                            </div>
                            <button
                              onClick={() => setReplyTo(null)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder={replyTo ? "Ketik balasan..." : "Ketik pesan..."}
                            value={announcementMessage}
                            onChange={(e) => setAnnouncementMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendAnnouncement()}
                            className="flex-1 px-4 py-2 rounded-full bg-white border-none text-[#303030] focus:outline-none focus:ring-2 focus:ring-[#075E54]/30"
                          />
                          <button
                            onClick={handleSendAnnouncement}
                            className="w-10 h-10 rounded-full bg-[#075E54] text-white flex items-center justify-center hover:bg-[#128C7E] transition-all"
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Pengaduan Tab */}
              {activeTab === 'pengaduan' && (
                <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden">
                  <div className="p-4 border-b border-[#C4A484]/30">
                    <h3 className="text-lg font-bold text-[#6B5344]">💬 Pengaduan / Pertanyaan</h3>
                    <p className="text-sm text-[#8B7355]">Kirim pesan pribadi ke bendahara</p>
                  </div>
                  
                  {/* Get or create thread */}
                  {(() => {
                    const student = currentUser as Student
                    const existingThread = data.pengaduanThreads?.find(t => t.nim === student.nim)
                    
                    return (
                      <div className="flex flex-col h-[500px]">
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f5f5f5]">
                          {existingThread ? (
                            existingThread.messages.map((msg, idx) => (
                              <div
                                key={msg.id || idx}
                                className={`flex ${msg.senderType === 'mahasiswa' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className={`max-w-[80%] rounded-2xl p-3 ${
                                  msg.senderType === 'mahasiswa' 
                                    ? 'bg-[#DCF8C6] text-[#303030]' 
                                    : 'bg-white text-[#303030] shadow'
                                }`}>
                                  <p className="text-xs font-medium mb-1 text-[#075E54]">
                                    {msg.sender}
                                    {msg.senderType === 'bendahara' && ' 👑'}
                                  </p>
                                  <p className="whitespace-pre-wrap">{msg.message}</p>
                                  <p className="text-[10px] text-gray-400 mt-1 text-right">{msg.timestamp}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <p className="text-gray-400 text-center">
                                Belum ada percakapan.<br/>
                                Kirim pesan untuk memulai.
                              </p>
                            </div>
                          )}
                          <div ref={pengaduanMessagesEndRef} />
                        </div>
                        
                        {/* Input */}
                        <div className="p-4 bg-white border-t border-gray-200">
                          <div className="flex gap-2">
                            <textarea
                              placeholder="Ketik pesan..."
                              value={pengaduanMessage}
                              onChange={(e) => setPengaduanMessage(e.target.value)}
                              className="flex-1 px-4 py-2 rounded-xl border border-[#C4A484] bg-white/80 text-[#6B5344] resize-none"
                              rows={2}
                            />
                            <button
                              onClick={() => {
                                if (!pengaduanMessage.trim()) return
                                
                                const dt = getDateTime()
                                const newMessage: PengaduanMessage = {
                                  id: Date.now().toString(),
                                  sender: student.nama,
                                  senderNim: student.nim,
                                  senderType: 'mahasiswa',
                                  message: pengaduanMessage,
                                  timestamp: `${dt.jam}.${dt.menit}`
                                }
                                
                                const updatedThreads = [...(data.pengaduanThreads || [])]
                                const threadIndex = updatedThreads.findIndex(t => t.nim === student.nim)
                                
                                if (threadIndex >= 0) {
                                  updatedThreads[threadIndex] = {
                                    ...updatedThreads[threadIndex],
                                    messages: [...updatedThreads[threadIndex].messages, newMessage]
                                  }
                                } else {
                                  updatedThreads.push({
                                    nim: student.nim,
                                    nama: student.nama,
                                    messages: [newMessage],
                                    status: 'active',
                                    createdAt: new Date().toISOString()
                                  })
                                }
                                
                                saveData({ ...data, pengaduanThreads: updatedThreads })
                                setPengaduanMessage('')
                                showToast('Pesan terkirim!', 'success')
                              }}
                              className="px-4 py-2 bg-[#075E54] text-white rounded-xl font-medium hover:bg-[#128C7E]"
                            >
                              Kirim
                            </button>
                          </div>
                          {existingThread?.status === 'selesai' && (
                            <p className="text-xs text-green-600 mt-2 text-center">
                              ✅ Pengaduan sudah ditandai selesai oleh bendahara
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BENDAHARA DASHBOARD */}
      {view === 'bendahara' && data && (
        <div className="min-h-screen">
          {/* Mobile header */}
          <div className="lg:hidden fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg z-40 px-4 py-3 flex justify-between items-center border-b border-[#C4A484]/30">
            <button onClick={() => setSidebarOpen(true)} className="text-[#6B5344]">
              <MenuIcon />
            </button>
            <span className="font-semibold text-[#6B5344]">Dashboard Bendahara</span>
            <button onClick={handleLogout} className="text-[#6B5344]">
              <LogoutIcon />
            </button>
          </div>

          {/* Sidebar overlay */}
          {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
          )}

          {/* Sidebar */}
          <div className={`fixed top-0 left-0 h-full w-64 bg-white/90 backdrop-blur-xl z-50 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 border-r border-[#C4A484]/30 overflow-y-auto`}>
            <div className="p-4 border-b border-[#C4A484]/30 flex justify-between items-center">
              <h2 className="font-bold text-[#6B5344]">Menu Bendahara</h2>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-[#6B5344]">
                <CloseIcon />
              </button>
            </div>

            {/* Profile */}
            <div className="p-4 border-b border-[#C4A484]/30">
              <div className="text-center">
                <div className="text-5xl mb-2">{data.bendahara.avatar}</div>
                <p className="font-bold text-[#6B5344]">{data.bendahara.username}</p>
                <p className="text-sm text-[#8B7355]">Bendahara</p>
              </div>
              
              {/* Change password */}
              <div className="mt-4">
                {editBendaharaPassword ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type={showBendaharaPassword ? 'text' : 'password'}
                        value={newBendaharaPassword}
                        onChange={(e) => setNewBendaharaPassword(e.target.value)}
                        placeholder="Password baru"
                        className="w-full px-3 py-2 pr-10 rounded-lg border border-[#C4A484] bg-white/80 text-[#6B5344] text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowBendaharaPassword(!showBendaharaPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8B7355] p-0.5"
                      >
                        {showBendaharaPassword ? <EyeCloseIcon /> : <EyeOpenIcon />}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateBendaharaPassword}
                        className="flex-1 py-1 bg-green-500 text-white rounded-lg text-sm"
                      >
                        Simpan
                      </button>
                      <button
                        onClick={() => { setEditBendaharaPassword(false); setNewBendaharaPassword('') }}
                        className="flex-1 py-1 bg-gray-400 text-white rounded-lg text-sm"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditBendaharaPassword(true)}
                    className="w-full py-2 text-[#8B7355] hover:text-[#6B5344] text-sm"
                  >
                    🔐 Ganti Password
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 space-y-2">
              <button
                onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false) }}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-[#C4A484] text-white' : 'text-[#6B5344] hover:bg-[#E8D4C4]'}`}
              >
                🏠 Dashboard
              </button>
              <button
                onClick={() => { setActiveTab('mahasiswa'); setSidebarOpen(false) }}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === 'mahasiswa' ? 'bg-[#C4A484] text-white' : 'text-[#6B5344] hover:bg-[#E8D4C4]'}`}
              >
                👥 Data Mahasiswa
              </button>
              <button
                onClick={() => { setActiveTab('pengeluaran'); setSidebarOpen(false) }}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === 'pengeluaran' ? 'bg-[#C4A484] text-white' : 'text-[#6B5344] hover:bg-[#E8D4C4]'}`}
              >
                💸 Catat Pengeluaran
              </button>
              <button
                onClick={() => { setActiveTab('laporan'); setSidebarOpen(false) }}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === 'laporan' ? 'bg-[#C4A484] text-white' : 'text-[#6B5344] hover:bg-[#E8D4C4]'}`}
              >
                📊 Laporan Keuangan
              </button>
              <button
                onClick={() => { setActiveTab('pengumuman'); setSidebarOpen(false) }}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === 'pengumuman' ? 'bg-[#C4A484] text-white' : 'text-[#6B5344] hover:bg-[#E8D4C4]'}`}
              >
                📢 Pengumuman
              </button>
              <button
                onClick={() => { setActiveTab('pengaduan'); setSidebarOpen(false) }}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === 'pengaduan' ? 'bg-[#C4A484] text-white' : 'text-[#6B5344] hover:bg-[#E8D4C4]'}`}
              >
                💬 Pengaduan
              </button>
              <button
                onClick={() => { setActiveTab('pengaturan'); setSidebarOpen(false) }}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === 'pengaturan' ? 'bg-[#C4A484] text-white' : 'text-[#6B5344] hover:bg-[#E8D4C4]'}`}
              >
                ⚙️ Pengaturan
              </button>
            </div>

            <div className="p-4 border-t border-[#C4A484]/30 space-y-2">
              <button
                onClick={handleToggleWeb}
                className={`w-full py-2 rounded-xl font-medium ${data.settings.webActive ? 'bg-red-400/80 text-white' : 'bg-green-500 text-white'}`}
              >
                {data.settings.webActive ? '🔴 Nonaktifkan Web' : '🟢 Aktifkan Web'}
              </button>
              <button
                onClick={handleLogout}
                className="w-full py-2 bg-red-400/80 text-white rounded-xl font-medium hover:bg-red-500 transition-all"
              >
                Keluar
              </button>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:ml-64 pt-16 lg:pt-0">
            {/* Desktop header */}
            <div className="hidden lg:flex justify-between items-center p-6 bg-white/50 backdrop-blur-lg border-b border-[#C4A484]/30">
              <h1 className="text-2xl font-bold text-[#6B5344]">Dashboard Bendahara</h1>
              <div className="flex items-center gap-3">
                {/* Notification Toggle */}
                <button
                  onClick={toggleNotifications}
                  className={`p-2 rounded-xl transition-all ${
                    notificationPermission === 'granted' && notificationEnabled
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : notificationPermission === 'denied'
                        ? 'bg-red-100 text-red-400'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                  title={
                    notificationPermission === 'denied'
                      ? 'Notifikasi diblokir browser'
                      : notificationEnabled
                        ? 'Nonaktifkan notifikasi'
                        : 'Aktifkan notifikasi'
                  }
                >
                  {notificationPermission === 'granted' && notificationEnabled ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                      <line x1="12" y1="2" x2="12" y2="12"></line>
                    </svg>
                  )}
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-400/80 text-white rounded-xl font-medium hover:bg-red-500 transition-all flex items-center gap-2"
                >
                  <LogoutIcon /> Keluar
                </button>
              </div>
            </div>

            <div className="p-4 lg:p-6">
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Statistics Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-4 shadow-lg border border-white/50">
                      <p className="text-sm text-[#8B7355]">Total Mahasiswa</p>
                      <p className="text-2xl font-bold text-[#6B5344]">{getStatistics().total}</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-4 shadow-lg border border-white/50">
                      <p className="text-sm text-[#8B7355]">Sudah Lunas</p>
                      <p className="text-2xl font-bold text-green-600">{getStatistics().lunas}</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-4 shadow-lg border border-white/50">
                      <p className="text-sm text-[#8B7355]">Belum/Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">{getStatistics().pending}</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-4 shadow-lg border border-white/50">
                      <p className="text-sm text-[#8B7355]">Saldo Kas</p>
                      <p className="text-xl font-bold text-[#6B5344]">Rp {formatRupiah(getStatistics().saldo)}</p>
                    </div>
                  </div>

                  {/* Pending payments */}
                  <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/50">
                    <h3 className="text-lg font-bold text-[#6B5344] mb-4">⏳ Menunggu Verifikasi</h3>
                    
                    {data.students.filter(s => s.status.includes('pending')).length === 0 ? (
                      <p className="text-[#8B7355]">Tidak ada pembayaran yang menunggu verifikasi</p>
                    ) : (
                      <div className="space-y-3">
                        {data.students.filter(s => s.status.includes('pending')).map(s => (
                          <div key={s.nim} className="p-4 bg-[#F5E6D3] rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                              <p className="font-medium text-[#6B5344]">{s.nama} ({s.nim})</p>
                              <p className="text-sm text-[#8B7355]">
                                {s.status === 'pending_denda' ? `Denda: Rp ${formatRupiah(s.denda)}` : 
                                 s.status === 'pending_g1' ? `Gelombang 1: Rp ${formatRupiah(data.settings.gelombang1Nominal)}` :
                                 s.status === 'pending_g2' ? `Gelombang 2: Rp ${formatRupiah(data.settings.gelombang2Nominal)}` :
                                 s.status === 'pending_g3' ? `Gelombang 3: Rp ${formatRupiah(data.settings.gelombang3Nominal)}` :
                                 `Lunas: Rp ${formatRupiah(data.settings.langsungLunasNominal)}`}
                              </p>
                              {s.pendingSince && (
                                <p className="text-xs text-[#8B7355]">{getTimeRemaining(s.pendingSince)}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleVerifyPayment(s.nim, true)}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-all"
                              >
                                ✓ Verif
                              </button>
                              <button
                                onClick={() => handleVerifyPayment(s.nim, false)}
                                className="px-4 py-2 bg-red-400 text-white rounded-lg font-medium hover:bg-red-500 transition-all"
                              >
                                ✗ Tolak
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mahasiswa Tab - Card Based Layout */}
              {activeTab === 'mahasiswa' && (
                <div className="space-y-6">
                  {/* Add student */}
                  <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/50">
                    <h3 className="text-lg font-bold text-[#6B5344] mb-4">➕ Tambah Mahasiswa</h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        placeholder="NIM"
                        value={addStudentForm.nim}
                        onChange={(e) => setAddStudentForm({ ...addStudentForm, nim: e.target.value })}
                        className="flex-1 px-4 py-2 rounded-xl border border-[#C4A484] bg-white/80 text-[#6B5344]"
                      />
                      <input
                        type="text"
                        placeholder="Nama Lengkap"
                        value={addStudentForm.nama}
                        onChange={(e) => setAddStudentForm({ ...addStudentForm, nama: e.target.value })}
                        className="flex-1 px-4 py-2 rounded-xl border border-[#C4A484] bg-white/80 text-[#6B5344]"
                      />
                      <button
                        onClick={handleAddStudent}
                        className="px-6 py-2 bg-[#C4A484] text-white rounded-xl font-medium hover:bg-[#8B7355] transition-all"
                      >
                        Tambah
                      </button>
                    </div>
                  </div>

                  {/* Student list - Card Based */}
                  <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/50">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-[#6B5344]">👥 Daftar Mahasiswa</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={generateStudentPDF}
                          className="px-4 py-2 bg-[#C4A484] text-white rounded-lg text-sm flex items-center gap-2"
                        >
                          <DownloadIcon /> PDF
                        </button>
                      </div>
                    </div>

                    {/* Student Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2">
                      {data.students.map(s => (
                        <div 
                          key={s.nim} 
                          className={`bg-gradient-to-br from-[#F5E6D3] to-[#E8D4C4] rounded-2xl p-4 shadow-md hover:shadow-lg transition-all border-2 ${
                            s.status === 'lunas' || s.status === 'verified_g3' ? 'border-green-300' :
                            s.status.includes('pending') ? 'border-yellow-300' :
                            s.status === 'rejected' ? 'border-red-300' :
                            'border-[#C4A484]/30'
                          }`}
                        >
                          {/* Card Header with Avatar and Name */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-3xl">
                              {s.avatar || '👩🏻‍⚕️'}
                            </div>
                            <div className="flex-1 min-w-0">
                              {editStudentNim === s.nim ? (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={editStudentForm.nim}
                                    onChange={(e) => setEditStudentForm({ ...editStudentForm, nim: e.target.value })}
                                    className="w-full px-2 py-1 rounded border border-[#C4A484] bg-white text-sm"
                                    placeholder="NIM"
                                  />
                                  <input
                                    type="text"
                                    value={editStudentForm.nama}
                                    onChange={(e) => setEditStudentForm({ ...editStudentForm, nama: e.target.value })}
                                    className="w-full px-2 py-1 rounded border border-[#C4A484] bg-white text-sm"
                                    placeholder="Nama"
                                  />
                                </div>
                              ) : (
                                <>
                                  <p className="font-bold text-[#6B5344] truncate">{s.nama}</p>
                                  <p className="text-sm text-[#8B7355]">{s.nim}</p>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="mb-3">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              s.status === 'lunas' || s.status === 'verified_g3' ? 'bg-green-100 text-green-700 border border-green-300' :
                              s.status.includes('pending') ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                              s.status === 'rejected' ? 'bg-red-100 text-red-700 border border-red-300' :
                              'bg-gray-100 text-gray-700 border border-gray-300'
                            }`}>
                              {getStatusText(s.status)}
                            </span>
                          </div>

                          {/* Info Row */}
                          <div className="flex items-center justify-between text-sm mb-3">
                            <div className="flex items-center gap-1">
                              <span className="text-[#8B7355]">Denda:</span>
                              {s.denda > 0 ? (
                                <span className="text-red-600 font-medium">Rp {formatRupiah(s.denda)}</span>
                              ) : (
                                <span className="text-green-600">-</span>
                              )}
                            </div>
                            <button
                              onClick={() => showDialog('Password', `Password: ${s.password}`, 'alert')}
                              className="text-[#8B7355] hover:text-[#6B5344] text-xs underline"
                            >
                              🔑 Password
                            </button>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2">
                            {editStudentNim === s.nim ? (
                              <>
                                <button
                                  onClick={handleEditStudent}
                                  className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-all"
                                >
                                  ✓ Simpan
                                </button>
                                <button
                                  onClick={() => setEditStudentNim(null)}
                                  className="flex-1 px-3 py-2 bg-gray-400 text-white rounded-lg text-xs font-medium hover:bg-gray-500 transition-all"
                                >
                                  ✕ Batal
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => { setEditStudentNim(s.nim); setEditStudentForm({ nim: s.nim, nama: s.nama }) }}
                                  className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-all"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => { setSelectedStudentNim(s.nim); setNewDendaAmount('') }}
                                  className="flex-1 px-3 py-2 bg-yellow-500 text-white rounded-lg text-xs font-medium hover:bg-yellow-600 transition-all"
                                >
                                  ⚠️ +Denda
                                </button>
                                <button
                                  onClick={() => handleHapusDenda(s.nim)}
                                  className="px-3 py-2 bg-orange-400 text-white rounded-lg text-xs font-medium hover:bg-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={s.denda <= 0}
                                >
                                  🗑️ Denda
                                </button>
                                <button
                                  onClick={() => handleDeleteStudent(s.nim)}
                                  className="px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-all"
                                >
                                  🗑️
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add denda dialog */}
                    {selectedStudentNim && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
                          <h4 className="font-bold text-[#6B5344] mb-4">Tambah Denda</h4>
                          <p className="text-sm text-[#8B7355] mb-2">
                            Mahasiswa: {data.students.find(s => s.nim === selectedStudentNim)?.nama}
                          </p>
                          <input
                            type="number"
                            placeholder="Nominal denda"
                            value={newDendaAmount}
                            onChange={(e) => setNewDendaAmount(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-[#C4A484] bg-white/80 text-[#6B5344] mb-4"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleAddDenda}
                              className="flex-1 py-2 bg-[#C4A484] text-white rounded-xl font-medium"
                            >
                              Tambah
                            </button>
                            <button
                              onClick={() => setSelectedStudentNim(null)}
                              className="flex-1 py-2 bg-gray-300 text-[#6B5344] rounded-xl font-medium"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pengeluaran Tab */}
              {activeTab === 'pengeluaran' && (
                <div className="space-y-6">
                  {/* Add pengeluaran */}
                  <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/50">
                    <h3 className="text-lg font-bold text-[#6B5344] mb-4">💸 Catat Pengeluaran</h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        placeholder="Keterangan (Apa)"
                        value={pengeluaranForm.keterangan}
                        onChange={(e) => setPengeluaranForm({ ...pengeluaranForm, keterangan: e.target.value })}
                        className="flex-1 px-4 py-2 rounded-xl border border-[#C4A484] bg-white/80 text-[#6B5344]"
                      />
                      <input
                        type="number"
                        placeholder="Nominal (Rp)"
                        value={pengeluaranForm.nominal}
                        onChange={(e) => setPengeluaranForm({ ...pengeluaranForm, nominal: e.target.value })}
                        className="w-40 px-4 py-2 rounded-xl border border-[#C4A484] bg-white/80 text-[#6B5344]"
                      />
                      <button
                        onClick={handleAddPengeluaran}
                        className="px-6 py-2 bg-red-400 text-white rounded-xl font-medium hover:bg-red-500 transition-all"
                      >
                        Catat
                      </button>
                    </div>
                  </div>

                  {/* Add saldo awal */}
                  <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/50">
                    <h3 className="text-lg font-bold text-[#6B5344] mb-4">💰 Tambah Saldo Awal</h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="number"
                        placeholder="Nominal Saldo Awal (Rp)"
                        value={saldoAwalForm}
                        onChange={(e) => setSaldoAwalForm(e.target.value)}
                        className="flex-1 px-4 py-2 rounded-xl border border-[#C4A484] bg-white/80 text-[#6B5344]"
                      />
                      <button
                        onClick={handleAddSaldoAwal}
                        className="px-6 py-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-all"
                      >
                        Tambah
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Laporan Tab */}
              {activeTab === 'laporan' && (
                <div className="space-y-6">
                  {/* Filters */}
                  <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/50">
                    <div className="flex flex-wrap gap-4 items-end">
                      <div>
                        <label className="text-sm text-[#8B7355] block mb-1">Tahun</label>
                        <select
                          value={filterYear}
                          onChange={(e) => setFilterYear(e.target.value)}
                          className="px-4 py-2 rounded-xl border border-[#C4A484] bg-white/80 text-[#6B5344]"
                        >
                          <option value="semua">Semua Tahun</option>
                          {getAvailableYears().filter(y => y !== 'semua').map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-[#8B7355] block mb-1">Bulan</label>
                        <select
                          value={filterMonth}
                          onChange={(e) => setFilterMonth(e.target.value)}
                          className="px-4 py-2 rounded-xl border border-[#C4A484] bg-white/80 text-[#6B5344]"
                        >
                          <option value="semua">Semua Bulan</option>
                          {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (
                            <option key={m} value={(i + 1).toString()}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={generatePDF}
                        className="px-6 py-2 bg-[#C4A484] text-white rounded-xl font-medium hover:bg-[#8B7355] transition-all flex items-center gap-2"
                      >
                        <DownloadIcon /> Download PDF
                      </button>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-4 shadow-lg border border-white/50">
                      <p className="text-sm text-[#8B7355]">Total Mahasiswa</p>
                      <p className="text-2xl font-bold text-[#6B5344]">{getStatistics().total}</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-4 shadow-lg border border-white/50">
                      <p className="text-sm text-[#8B7355]">Sudah Lunas</p>
                      <p className="text-2xl font-bold text-green-600">{getStatistics().lunas}</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-4 shadow-lg border border-white/50">
                      <p className="text-sm text-[#8B7355]">Belum/Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">{getStatistics().pending}</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-4 shadow-lg border border-white/50">
                      <p className="text-sm text-[#8B7355]">Saldo Kas</p>
                      <p className="text-xl font-bold text-[#6B5344]">Rp {formatRupiah(getStatistics().saldo)}</p>
                    </div>
                  </div>

                  {/* Transaction cards */}
                  <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/50">
                    <h3 className="text-lg font-bold text-[#6B5344] mb-4">📋 Riwayat Transaksi</h3>
                    
                    {getFilteredTransactions().length === 0 ? (
                      <p className="text-[#8B7355]">Belum ada transaksi</p>
                    ) : (
                      <div className="space-y-3">
                        {getFilteredTransactions().map(t => (
                          <div key={t.id} className={`p-4 rounded-xl ${
                            t.type === 'pengeluaran' ? 'bg-red-50 border border-red-200' :
                            t.type === 'saldo_awal' ? 'bg-blue-50 border border-blue-200' :
                            t.type === 'pemasukan_denda' ? 'bg-yellow-50 border border-yellow-200' :
                            'bg-green-50 border border-green-200'
                          }`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-[#6B5344]">{t.keterangan}</p>
                                <p className="text-sm text-[#8B7355]">{t.hari}, {t.tanggal} {t.bulan} {t.tahun} - {t.jam}</p>
                              </div>
                              <p className={`font-bold ${
                                t.type === 'pengeluaran' ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {t.type === 'pengeluaran' ? '-' : '+'}Rp {formatRupiah(t.nominal)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pengumuman Tab - WhatsApp Style for Bendahara */}
              {activeTab === 'pengumuman' && (
                <div className="bg-[#E5DDD5] rounded-2xl shadow-lg overflow-hidden flex flex-col h-[600px]">
                  {/* Header */}
                  <div className="bg-[#075E54] text-white p-4 flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl cursor-pointer hover:bg-white/30 transition-all relative overflow-hidden"
                      onClick={() => groupAvatarInputRef.current?.click()}
                      title="Klik untuk ganti foto grup dengan gambar"
                    >
                      {data.settings.groupAvatarUrl ? (
                        <img src={data.settings.groupAvatarUrl} alt="Group" className="w-full h-full object-cover" />
                      ) : (
                        data.settings.groupAvatar || '👥'
                      )}
                      <span className="absolute -bottom-1 -right-1 text-[10px] bg-white/30 rounded-full px-1">📷</span>
                      <input
                        ref={groupAvatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onloadend = () => {
                              handleUpdateGroupAvatarUrl(reader.result as string)
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      {editGroupName ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            className="px-2 py-1 rounded text-[#075E54] text-sm w-40 bg-white"
                            placeholder="Nama Grup"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdateGroupName()
                              if (e.key === 'Escape') { setEditGroupName(false); setNewGroupName('') }
                            }}
                          />
                          <button
                            onClick={handleUpdateGroupName}
                            className="px-2 py-1 bg-white/20 rounded text-xs hover:bg-white/30"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => { setEditGroupName(false); setNewGroupName('') }}
                            className="px-2 py-1 bg-white/20 rounded text-xs hover:bg-white/30"
                          >
                            ✗
                          </button>
                        </div>
                      ) : (
                        <h3 
                          className="font-bold cursor-pointer hover:underline"
                          onClick={() => { setEditGroupName(true); setNewGroupName(data.settings.groupName || '') }}
                          title="Klik untuk ganti nama grup"
                        >
                          {data.settings.groupName || 'Grup Kas Kelas'} ✏️
                        </h3>
                      )}
                      <p className="text-xs text-white/70">{data.students.length} anggota • {data.announcements.length} pesan</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleToggleAnnouncement}
                        className={`px-3 py-1 rounded-lg text-xs ${data.settings.announcementActive === false ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
                      >
                        {data.settings.announcementActive === false ? '🔒 Hanya Bendahara' : '🌐 Semua'}
                      </button>
                      <button
                        onClick={() => setShowGroupAvatarPicker(true)}
                        className="px-3 py-1 bg-white/20 text-white rounded-lg text-xs hover:bg-white/30"
                      >
                        😀 Emoji
                      </button>
                      <button
                        onClick={handleClearAllAnnouncements}
                        className="px-3 py-1 bg-red-500/80 text-white rounded-lg text-xs hover:bg-red-600"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Pinned announcement - WhatsApp style */}
                  {data.announcements.filter(a => a.pinned).length > 0 && (
                    <div 
                      className="bg-[#DCF8C6] border-b border-[#25D366]/20 p-2 cursor-pointer hover:bg-[#d0f0b0] transition-colors"
                      onClick={() => setViewPinnedMessage(true)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#075E54]">📌</span>
                        <span className="text-xs text-[#075E54] font-medium">Pesan Disematkan</span>
                        <span className="text-xs text-[#075E54]/60 ml-auto">Klik untuk lihat</span>
                      </div>
                      {data.announcements.filter(a => a.pinned).slice(0, 1).map(a => (
                        <div key={a.id} className="bg-white/80 p-2 rounded-lg text-sm" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-between items-start">
                            <p className="font-medium text-[#075E54]">{a.sender} {a.senderType === 'bendahara' && '👑'}</p>
                            <button
                              onClick={(e) => { e.stopPropagation(); handlePinAnnouncement(a.id) }}
                              className="text-[#667781] text-xs hover:text-[#075E54]"
                            >
                              Unpin
                            </button>
                          </div>
                          <p className="text-[#303030] truncate">{a.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Messages list - WhatsApp style */}
                  <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#E5DDD5]" style={{
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
                  }}>
                    {data.announcements.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-[#667781] text-center">Belum ada pesan</p>
                      </div>
                    ) : (
                      <>
                        {data.announcements.map(a => {
                          const isBendaharaMessage = a.senderType === 'bendahara'
                          const isSelected = selectedMessageId === a.id
                          const isHighlighted = highlightedMessageId === a.id
                          const reactions = a.reactions || []

                          return (
                          <div key={a.id} id={`message-${a.id}`} className={`flex ${isBendaharaMessage ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[80%] ${isBendaharaMessage ? 'bg-[#DCF8C6]' : 'bg-white'} ${isHighlighted ? 'ring-2 ring-[#075E54] ring-offset-2 animate-pulse' : ''} rounded-lg shadow-sm relative cursor-pointer transition-all`}
                              onClick={() => setSelectedMessageId(isSelected ? null : a.id)}
                            >
                              {/* Sender name */}
                              {!isBendaharaMessage && (
                                <p className="text-xs font-bold text-[#075E54] px-3 pt-2 pb-1">
                                  {a.sender}
                                </p>
                              )}
                              
                              {/* Edit mode */}
                              {editAnnouncementId === a.id ? (
                                <div className="p-2 space-y-2">
                                  <textarea
                                    value={editAnnouncementMessage}
                                    onChange={(e) => setEditAnnouncementMessage(e.target.value)}
                                    className="w-full p-2 rounded border border-[#075E54]/30 bg-white text-[#303030] text-sm"
                                    rows={2}
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleSaveEditAnnouncement() }}
                                      className="px-3 py-1 bg-[#075E54] text-white rounded text-sm"
                                    >
                                      Simpan
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setEditAnnouncementId(null) }}
                                      className="px-3 py-1 bg-gray-300 text-[#303030] rounded text-sm"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {/* Reply indicator in message */}
                                  {a.replyTo && (
                                    <div
                                      className="mx-3 mt-2 px-2 py-1 bg-gray-100/80 rounded border-l-2 border-[#075E54] cursor-pointer hover:bg-gray-200/80 transition-colors"
                                      onClick={(e) => { e.stopPropagation(); scrollToMessage(a.replyTo!.id) }}
                                    >
                                      <p className="text-xs font-medium text-[#075E54]">{a.replyTo.sender}</p>
                                      <p className="text-xs text-gray-500 truncate">{a.replyTo.message}</p>
                                    </div>
                                  )}
                                  <div className="px-3 pb-2">
                                    <p className="text-[#303030] text-sm whitespace-pre-wrap">{a.message}</p>
                                    <p className={`text-[10px] text-[#667781] text-right mt-1 flex items-center justify-end gap-1`}>
                                      {a.timestamp}
                                      {isBendaharaMessage && <span className="text-[#53BDEB]">✓✓</span>}
                                    </p>
                                  </div>
                                  
                                  {/* Reactions */}
                                  {reactions.length > 0 && (
                                    <div className="flex flex-wrap gap-1 px-2 pb-1">
                                      {Object.entries(reactions.reduce((acc, r) => {
                                        acc[r.emoji] = (acc[r.emoji] || 0) + 1
                                        return acc
                                      }, {} as Record<string, number>)).map(([emoji, count]) => (
                                        <span key={emoji} className="bg-white/80 px-1.5 py-0.5 rounded-full text-xs border border-gray-200">
                                          {emoji} {count}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Reaction picker */}
                                  {showReactionPicker === a.id && (
                                    <div className="absolute bottom-full left-0 mb-1 bg-white rounded-lg shadow-lg p-2 flex gap-1 z-10" onClick={(e) => e.stopPropagation()}>
                                      {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                        <button
                                          key={emoji}
                                          onClick={(e) => { e.stopPropagation(); handleAddReaction(a.id, emoji) }}
                                          className="text-lg hover:scale-125 transition-transform"
                                        >
                                          {emoji}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Message actions - Bendahara bisa semua */}
                                  {isSelected && (
                                    <div className="flex gap-1 px-2 pb-2 pt-1 border-t border-gray-200 flex-wrap">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setReplyTo({ id: a.id, sender: a.sender, message: a.message }); setSelectedMessageId(null) }}
                                        className="text-[#667781] hover:text-[#075E54] p-1.5 bg-white/60 rounded text-xs flex items-center justify-center gap-1 font-medium"
                                      >
                                        ↩️ Balas
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setShowReactionPicker(showReactionPicker === a.id ? null : a.id) }}
                                        className="text-[#667781] hover:text-[#075E54] p-1.5 bg-white/60 rounded text-xs flex items-center justify-center gap-1 font-medium"
                                      >
                                        😀 React
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleEditAnnouncement(a.id, a.message) }}
                                        className="text-[#667781] hover:text-[#075E54] p-1.5 bg-white/60 rounded text-xs flex items-center justify-center gap-1 font-medium"
                                      >
                                        <EditIcon /> Edit
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handlePinAnnouncement(a.id) }}
                                        className={`${a.pinned ? 'text-yellow-500' : 'text-[#667781]'} hover:text-yellow-600 p-1.5 bg-white/60 rounded text-xs flex items-center justify-center gap-1 font-medium`}
                                      >
                                        <PinIcon /> {a.pinned ? 'Unpin' : 'Pin'}
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteAnnouncement(a.id) }}
                                        className="text-red-500 hover:text-red-700 p-1.5 bg-white/60 rounded text-xs flex items-center justify-center gap-1 font-medium"
                                      >
                                        <TrashIcon /> Hapus
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )
                        })}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Message input - WhatsApp style */}
                  <div className="bg-[#F0F0F0] p-3">
                    {/* Reply indicator */}
                    {replyTo && (
                      <div className="flex items-center gap-2 mb-2 px-2 py-1 bg-[#075E54]/10 rounded-lg">
                        <div className="w-1 h-8 bg-[#075E54] rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-[#075E54]">Membalas {replyTo.sender}</p>
                          <p className="text-xs text-gray-500 truncate">{replyTo.message}</p>
                        </div>
                        <button
                          onClick={() => setReplyTo(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={replyTo ? "Ketik balasan..." : "Ketik pengumuman..."}
                        value={announcementMessage}
                        onChange={(e) => setAnnouncementMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendAnnouncement()}
                        className="flex-1 px-4 py-2 rounded-full bg-white border-none text-[#303030] focus:outline-none focus:ring-2 focus:ring-[#075E54]/30"
                      />
                      <button
                        onClick={handleSendAnnouncement}
                        className="w-10 h-10 rounded-full bg-[#075E54] text-white flex items-center justify-center hover:bg-[#128C7E] transition-all"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Pengaturan Tab */}
              {activeTab === 'pengaturan' && (
                <div className="space-y-6">
                  {/* Nominal settings */}
                  <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/50">
                    <h3 className="text-lg font-bold text-[#6B5344] mb-4">💰 Pengaturan Nominal</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-[#8B7355] block mb-1">Gelombang 1 (Rp)</label>
                        <input
                          type="number"
                          value={data.settings.gelombang1Nominal}
                          onChange={(e) => saveData({
                            ...data,
                            settings: { ...data.settings, gelombang1Nominal: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full px-4 py-2 rounded-xl border border-[#C4A484] bg-white/80 text-[#6B5344]"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-[#8B7355] block mb-1">Gelombang 2 (Rp)</label>
                        <input
                          type="number"
                          value={data.settings.gelombang2Nominal}
                          onChange={(e) => saveData({
                            ...data,
                            settings: { ...data.settings, gelombang2Nominal: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full px-4 py-2 rounded-xl border border-[#C4A484] bg-white/80 text-[#6B5344]"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-[#8B7355] block mb-1">Gelombang 3 (Rp)</label>
                        <input
                          type="number"
                          value={data.settings.gelombang3Nominal}
                          onChange={(e) => saveData({
                            ...data,
                            settings: { ...data.settings, gelombang3Nominal: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full px-4 py-2 rounded-xl border border-[#C4A484] bg-white/80 text-[#6B5344]"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-[#8B7355] block mb-1">Langsung Lunas (Rp)</label>
                        <input
                          type="number"
                          value={data.settings.langsungLunasNominal}
                          onChange={(e) => saveData({
                            ...data,
                            settings: { ...data.settings, langsungLunasNominal: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full px-4 py-2 rounded-xl border border-[#C4A484] bg-white/80 text-[#6B5344]"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-[#8B7355] block mb-1">QRIS Expired (Menit)</label>
                        <input
                          type="number"
                          value={data.settings.qrisExpiryMinutes}
                          onChange={(e) => saveData({
                            ...data,
                            settings: { ...data.settings, qrisExpiryMinutes: parseInt(e.target.value) || 15 }
                          })}
                          className="w-full px-4 py-2 rounded-xl border border-[#C4A484] bg-white/80 text-[#6B5344]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Web inactive message */}
                  <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/50">
                    <h3 className="text-lg font-bold text-[#6B5344] mb-4">📝 Pesan Web Nonaktif</h3>
                    <textarea
                      value={data.settings.webInactiveMessage}
                      onChange={(e) => saveData({
                        ...data,
                        settings: { ...data.settings, webInactiveMessage: e.target.value }
                      })}
                      className="w-full px-4 py-2 rounded-xl border border-[#C4A484] bg-white/80 text-[#6B5344]"
                      rows={3}
                    />
                  </div>

                  {/* Backup & Restore */}
                  <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/50">
                    <h3 className="text-lg font-bold text-[#6B5344] mb-2">💾 Backup & Restore Data</h3>
                    <p className="text-sm text-[#8B7355] mb-4">
                      Backup data secara berkala untuk menghindari kehilangan data. Simpan file backup di Google Drive atau flashdisk.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      {/* Backup Button */}
                      <button
                        onClick={handleBackup}
                        className="py-4 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-all flex flex-col items-center gap-2"
                      >
                        <span className="text-2xl">📥</span>
                        <span>Download Backup</span>
                        <span className="text-xs opacity-80">Simpan ke Google Drive</span>
                      </button>

                      {/* Restore Button */}
                      <button
                        onClick={() => restoreInputRef.current?.click()}
                        className="py-4 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-all flex flex-col items-center gap-2"
                      >
                        <span className="text-2xl">📤</span>
                        <span>Restore Backup</span>
                        <span className="text-xs opacity-80">Upload file backup</span>
                      </button>
                      <input
                        ref={restoreInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleRestore}
                        className="hidden"
                      />
                    </div>

                    {/* Info */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                      <p className="text-xs text-yellow-800">
                        <strong>💡 Tips:</strong> Lakukan backup minimal 1x seminggu. Simpan file backup ke:
                      </p>
                      <ul className="text-xs text-yellow-700 mt-1 ml-4 list-disc">
                        <li>Google Drive / OneDrive / iCloud</li>
                        <li>Flashdisk</li>
                        <li>Email (kirim ke diri sendiri)</li>
                      </ul>
                    </div>
                  </div>

                  {/* Reset */}
                  <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/50">
                    <h3 className="text-lg font-bold text-[#6B5344] mb-4">⚠️ Reset Data</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      {/* Reset Keuangan */}
                      <div className="border border-yellow-300 rounded-xl p-4 bg-yellow-50/50">
                        <button
                          onClick={handleResetKeuangan}
                          className="w-full py-3 bg-yellow-500 text-white rounded-xl font-medium hover:bg-yellow-600 transition-all mb-3"
                        >
                          🔄 Reset Keuangan
                        </button>
                        <div className="text-xs text-[#6B5344] space-y-1">
                          <p className="font-medium">Yang direset:</p>
                          <p>• Status pembayaran</p>
                          <p>• Denda</p>
                          <p className="font-medium mt-2 text-green-600">Yang aman:</p>
                          <p className="text-green-600">• Nama, NIM, Password</p>
                          <p className="text-green-600">• Laporan Keuangan</p>
                          <p className="text-green-600">• Pengumuman</p>
                        </div>
                      </div>

                      {/* Reset Pabrik */}
                      <div className="border border-red-300 rounded-xl p-4 bg-red-50/50">
                        <button
                          onClick={handleResetPabrik}
                          className="w-full py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-all mb-3"
                        >
                          🏭 Reset Pabrik
                        </button>
                        <div className="text-xs text-[#6B5344] space-y-1">
                          <p className="font-medium">Yang direset:</p>
                          <p>• Status pembayaran</p>
                          <p>• Denda</p>
                          <p className="text-red-600">• Laporan Keuangan</p>
                          <p className="font-medium mt-2 text-green-600">Yang aman:</p>
                          <p className="text-green-600">• Nama, NIM, Password</p>
                          <p className="text-green-600">• Pengumuman</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pengaduan Tab - Bendahara */}
              {activeTab === 'pengaduan' && (
                <div className="space-y-6">
                  <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/50">
                    <h3 className="text-lg font-bold text-[#6B5344] mb-4">💬 Pengaduan Mahasiswa</h3>
                    
                    {/* Thread List */}
                    <div className="space-y-4">
                      {data.pengaduanThreads && data.pengaduanThreads.length > 0 ? (
                        data.pengaduanThreads.map(thread => {
                          const student = data.students.find(s => s.nim === thread.nim)
                          const lastMessage = thread.messages[thread.messages.length - 1]
                          
                          return (
                            <div
                              key={thread.nim}
                              className="bg-[#F5E6D3] rounded-xl p-4 cursor-pointer hover:bg-[#E8D4C4] transition-all"
                              onClick={() => setSelectedPengaduanNim(thread.nim)}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-3xl">{student?.avatar || '👩🏻‍⚕️'}</span>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <p className="font-medium text-[#6B5344]">{thread.nama}</p>
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      thread.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {thread.status === 'active' ? 'Aktif' : 'Selesai'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-[#8B7355]">{thread.nim}</p>
                                  <p className="text-xs text-gray-500 mt-1 truncate">
                                    {lastMessage?.message || 'Belum ada pesan'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-center text-[#8B7355] py-8">Belum ada pengaduan</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Selected Pengaduan Thread Dialog */}
      {selectedPengaduanNim && data && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            {(() => {
              const thread = data.pengaduanThreads?.find(t => t.nim === selectedPengaduanNim)
              const student = data.students.find(s => s.nim === selectedPengaduanNim)
              
              if (!thread) return null
              
              return (
                <>
                  {/* Header */}
                  <div className="p-4 border-b flex items-center gap-3">
                    <button
                      onClick={() => setSelectedPengaduanNim(null)}
                      className="text-gray-500 hover:text-gray-700 text-xl"
                    >
                      ←
                    </button>
                    <span className="text-2xl">{student?.avatar || '👩🏻‍⚕️'}</span>
                    <div className="flex-1">
                      <p className="font-bold text-[#6B5344]">{thread.nama}</p>
                      <p className="text-xs text-[#8B7355]">{thread.nim}</p>
                    </div>
                    <button
                      onClick={() => {
                        const updatedThreads = data.pengaduanThreads?.map(t => {
                          if (t.nim === selectedPengaduanNim) {
                            return {
                              ...t,
                              status: t.status === 'active' ? 'selesai' : 'active',
                              selesaiAt: t.status === 'active' ? new Date().toISOString() : undefined
                            }
                          }
                          return t
                        })
                        saveData({ ...data, pengaduanThreads: updatedThreads })
                        showToast(thread.status === 'active' ? 'Pengaduan diselesaikan!' : 'Pengaduan diaktifkan kembali!', 'success')
                      }}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        thread.status === 'active' 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {thread.status === 'active' ? '✓ Selesaikan' : 'Aktifkan'}
                    </button>
                  </div>
                  
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f5f5f5]">
                    {thread.messages.map((msg, idx) => (
                      <div
                        key={msg.id || idx}
                        className={`flex ${msg.senderType === 'bendahara' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] rounded-2xl p-3 ${
                          msg.senderType === 'bendahara' 
                            ? 'bg-[#DCF8C6] text-[#303030]' 
                            : 'bg-white text-[#303030] shadow'
                        }`}>
                          <p className="text-xs font-medium mb-1 text-[#075E54]">
                            {msg.sender}
                            {msg.senderType === 'bendahara' && ' 👑'}
                          </p>
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1 text-right">{msg.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Input */}
                  <div className="p-4 border-t bg-white">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ketik balasan..."
                        value={pengaduanMessage}
                        onChange={(e) => setPengaduanMessage(e.target.value)}
                        className="flex-1 px-4 py-2 rounded-xl border border-[#C4A484] bg-white/80 text-[#6B5344]"
                      />
                      <button
                        onClick={() => {
                          if (!pengaduanMessage.trim()) return
                          
                          const dt = getDateTime()
                          const newMessage: PengaduanMessage = {
                            id: Date.now().toString(),
                            sender: data.bendahara.username,
                            senderType: 'bendahara',
                            message: pengaduanMessage,
                            timestamp: `${dt.jam}.${dt.menit}`
                          }
                          
                          const updatedThreads = data.pengaduanThreads?.map(t => {
                            if (t.nim === selectedPengaduanNim) {
                              return {
                                ...t,
                                messages: [...t.messages, newMessage]
                              }
                            }
                            return t
                          })
                          
                          saveData({ ...data, pengaduanThreads: updatedThreads })
                          setPengaduanMessage('')
                          showToast('Balasan terkirim!', 'success')
                        }}
                        className="px-4 py-2 bg-[#075E54] text-white rounded-xl font-medium hover:bg-[#128C7E]"
                      >
                        Kirim
                      </button>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Lupa Password Dialog */}
      {lupaPasswordDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🔐</span>
              <h4 className="font-bold text-[#6B5344]">Lupa Password</h4>
            </div>
            <p className="text-sm text-[#8B7355] mb-4">Isi data untuk menghubungi Bendahara.</p>
            <input
              type="text"
              placeholder="Nama Lengkap"
              value={lupaPasswordForm.nama}
              onChange={(e) => setLupaPasswordForm({ ...lupaPasswordForm, nama: e.target.value.toUpperCase() })}
              className="w-full px-4 py-2 rounded-xl border border-[#C4A484] bg-white/80 text-[#6B5344] mb-3"
            />
            <input
              type="text"
              placeholder="NIM"
              value={lupaPasswordForm.nim}
              onChange={(e) => setLupaPasswordForm({ ...lupaPasswordForm, nim: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-[#C4A484] bg-white/80 text-[#6B5344] mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => openWhatsApp(`Halo Bendahara, saya lupa password.
👤 Nama: ${lupaPasswordForm.nama || '[NAMA]'}
🆔 NIM: ${lupaPasswordForm.nim || '[NIM]'}`)}
                className="flex-1 py-2 bg-pink-400 text-white rounded-xl font-medium"
              >
                Kirim ke WhatsApp
              </button>
              <button
                onClick={() => { setLupaPasswordDialog(false); setLupaPasswordForm({ nama: '', nim: '' }) }}
                className="px-4 py-2 bg-gray-300 text-[#6B5344] rounded-xl font-medium"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pinned Message Dialog */}
      {viewPinnedMessage && data && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📌</span>
              <h4 className="font-bold text-[#075E54]">Pesan Disematkan</h4>
            </div>
            <div className="space-y-3">
              {data.announcements.filter(a => a.pinned).map(a => (
                <div key={a.id} className="bg-[#DCF8C6] p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-[#075E54]">{a.sender}</span>
                    {a.senderType === 'bendahara' && <span>👑</span>}
                  </div>
                  <p className="text-[#303030] whitespace-pre-wrap">{a.message}</p>
                  <p className="text-xs text-[#667781] mt-2">{a.timestamp}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setViewPinnedMessage(false)}
              className="w-full mt-4 py-2 bg-[#075E54] text-white rounded-xl font-medium"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Avatar Picker Dialog */}
      {showAvatarPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h4 className="font-bold text-[#6B5344] mb-4 text-center">Pilih Avatar</h4>
            <div className="grid grid-cols-5 gap-3 mb-4">
              {['👩🏻‍⚕️', '🧑‍⚕️', '👨🏻‍⚕️', '👩🏻‍💼', '👨🏻‍💼', '👩🏻‍🎓', '👨🏻‍🎓', '🧕', '👳🏻', '👩🏻', '👨🏻', '🧑🏻', '👧🏻', '👦🏻', '👶🏻'].map(avatar => (
                <button
                  key={avatar}
                  onClick={() => handleUpdateAvatar(avatar)}
                  className="text-3xl p-2 hover:bg-[#F5E6D3] rounded-xl transition-all"
                >
                  {avatar}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAvatarPicker(false)}
              className="w-full py-2 bg-gray-300 text-[#6B5344] rounded-xl font-medium"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Group Avatar Picker Dialog */}
      {showGroupAvatarPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h4 className="font-bold text-[#6B5344] mb-4 text-center">Pilih Foto Grup</h4>
            <div className="grid grid-cols-5 gap-3 mb-4">
              {['👥', '👨‍👩‍👧‍👦', '👩‍👩‍👧‍👦', '👨‍👨‍👧‍👦', '🧑‍🤝‍🧑', '🏫', '🎓', '💼', '📋', '💰', '🎀', '💗', '🏥', '💊', '💉'].map(avatar => (
                <button
                  key={avatar}
                  onClick={() => handleUpdateGroupAvatar(avatar)}
                  className="text-3xl p-2 hover:bg-[#F5E6D3] rounded-xl transition-all"
                >
                  {avatar}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowGroupAvatarPicker(false)}
              className="w-full py-2 bg-gray-300 text-[#6B5344] rounded-xl font-medium"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Generic Dialog */}
      {dialog.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h4 className="font-bold text-[#6B5344] mb-2">{dialog.title}</h4>
            <p className="text-[#8B7355] mb-4">{dialog.message}</p>
            {dialog.inputs && dialog.inputs.map((input, i) => (
              <input
                key={i}
                type={input.type || 'text'}
                placeholder={input.placeholder}
                value={input.value}
                className="w-full px-4 py-2 rounded-xl border border-[#C4A484] bg-white/80 text-[#6B5344] mb-3"
              />
            ))}
            <div className="flex gap-2">
              <button
                onClick={handleDialogConfirm}
                className="flex-1 py-2 bg-[#C4A484] text-white rounded-xl font-medium"
              >
                {dialog.type === 'confirm' ? 'Ya' : 'OK'}
              </button>
              {dialog.showCancel && (
                <button
                  onClick={closeDialog}
                  className="px-4 py-2 bg-gray-300 text-[#6B5344] rounded-xl font-medium"
                >
                  Batal
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h4 className="font-bold text-red-600 mb-4">❌ Tolak Pembayaran</h4>
            <p className="text-sm text-[#8B7355] mb-2">
              Mahasiswa: {data?.students.find(s => s.nim === rejectStudentNim)?.nama}
            </p>
            <textarea
              placeholder="Masukkan alasan penolakan (opsional)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-red-300 bg-white/80 text-[#6B5344] mb-4"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleRejectPayment}
                className="flex-1 py-2 bg-red-500 text-white rounded-xl font-medium"
              >
                Tolak
              </button>
              <button
                onClick={() => { setShowRejectDialog(false); setRejectStudentNim(null); setRejectReason('') }}
                className="flex-1 py-2 bg-gray-300 text-[#6B5344] rounded-xl font-medium"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Request Dialog */}
      {showNotificationRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-4">
              <span className="text-4xl">🔔</span>
              <h4 className="font-bold text-[#6B5344] mt-2">Aktifkan Notifikasi?</h4>
              <p className="text-sm text-[#8B7355] mt-2">
                Dapatkan notifikasi saat pembayaran dikonfirmasi atau ada pengumuman baru.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={requestNotificationPermission}
                className="flex-1 py-2 bg-green-500 text-white rounded-xl font-medium"
              >
                Ya, Aktifkan
              </button>
              <button
                onClick={() => setShowNotificationRequest(false)}
                className="flex-1 py-2 bg-gray-300 text-[#6B5344] rounded-xl font-medium"
              >
                Nanti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Dialog - Thermal Receipt Style */}
      {showReceiptDialog && receiptData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-xs">
            {/* Receipt Preview */}
            <div 
              ref={receiptRef}
              className="bg-white rounded-lg p-4 font-mono text-sm shadow-xl"
              style={{ fontFamily: 'monospace' }}
            >
              {/* Header */}
              <div className="text-center border-b-2 border-dashed border-gray-300 pb-3 mb-3">
                <div className="text-lg font-bold tracking-wider">═════════════════════</div>
                <div className="text-xl font-bold mt-1">KASKITA</div>
                <div className="text-xs text-gray-600">Sistem Kas Kelas</div>
                <div className="text-lg font-bold mt-1">═════════════════════</div>
              </div>
              
              {/* Title */}
              <div className="text-center font-bold text-base mb-3">
                🧾 STRUK PEMBAYARAN
              </div>
              
              <div className="text-center text-gray-400 text-xs mb-3">───────────────────</div>
              
              {/* Content */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Nama</span>
                  <span className="font-medium">{receiptData.nama.substring(0, 18)}</span>
                </div>
                <div className="flex justify-between">
                  <span>NIM</span>
                  <span className="font-medium">{receiptData.nim}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jenis</span>
                  <span className="font-medium">{receiptData.paymentType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Metode</span>
                  <span className="font-medium">{receiptData.method}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal</span>
                  <span className="font-medium text-right text-[10px]">{receiptData.date.length > 20 ? receiptData.date.substring(0, 20) : receiptData.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu</span>
                  <span className="font-medium">{receiptData.time} WIB</span>
                </div>
              </div>
              
              <div className="text-center text-gray-400 text-xs my-3">───────────────────</div>
              
              {/* Total */}
              <div className="text-center mb-3">
                <div className="font-bold text-sm">TOTAL</div>
                <div className="font-bold text-xl">Rp {formatRupiah(receiptData.nominal)}</div>
              </div>
              
              <div className="text-center text-gray-400 text-xs mb-3">───────────────────</div>
              
              {/* Status */}
              <div className="text-center text-xs text-gray-600">
                <div className="font-medium">Status: MENUNGGU KONFIRMASI</div>
                <div className="mt-1 text-[10px]">Bukti telah dikirim ke Bendahara</div>
              </div>
              
              {/* Footer */}
              <div className="text-center border-t-2 border-dashed border-gray-300 pt-3 mt-3">
                <div className="font-bold">═════════════════════</div>
                <div className="text-xs mt-2">Terima kasih telah membayar!</div>
                <div className="text-xs font-bold mt-1">{data?.settings?.groupName || 'KasKita'}</div>
              </div>
            </div>
            
            {/* Buttons */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={downloadReceiptAsImage}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <DownloadIcon /> Download
              </button>
              <button
                onClick={() => {
                  setShowReceiptDialog(false)
                  setReceiptData(null)
                }}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
