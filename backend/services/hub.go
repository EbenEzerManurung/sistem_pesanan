package services

import (
	"encoding/json"
	"log"
	"sync"
)

// Event adalah struktur payload yang dikirim ke semua client SSE.
// Contoh:
//   { "type": "order.created", "data": { ... } }
type Event struct {
	Type string `json:"type"`
	Data any    `json:"data"`
}

// Hub mengelola semua koneksi SSE aktif.
// Thread-safe: aman dipanggil dari goroutine manapun.
type Hub struct {
	mu      sync.RWMutex
	clients map[chan []byte]struct{}
	debug   bool // kalau true, log setiap connect/disconnect
}

// NewHub membuat instance Hub baru.
func NewHub() *Hub {
	return &Hub{
		clients: make(map[chan []byte]struct{}),
		debug:   true,
	}
}

// ─────────────────────────────────────────────────────────────
// Subscribe — daftarkan client SSE baru.
// Return channel yang akan menerima semua broadcast.
// ─────────────────────────────────────────────────────────────
func (h *Hub) Subscribe() chan []byte {
	ch := make(chan []byte, 32) // buffer 32 event
	h.mu.Lock()
	h.clients[ch] = struct{}{}
	total := len(h.clients)
	h.mu.Unlock()

	if h.debug {
		log.Printf("📡 SSE subscribe | total clients: %d", total)
	}
	return ch
}

// ─────────────────────────────────────────────────────────────
// Unsubscribe — hapus client & tutup channel.
// Idempotent: aman dipanggil berkali-kali untuk channel yang sama.
// ─────────────────────────────────────────────────────────────
func (h *Hub) Unsubscribe(ch chan []byte) {
	h.mu.Lock()
	if _, ok := h.clients[ch]; ok {
		delete(h.clients, ch)
		close(ch)
	}
	total := len(h.clients)
	h.mu.Unlock()

	if h.debug {
		log.Printf("📡 SSE unsubscribe | total clients: %d", total)
	}
}

// ─────────────────────────────────────────────────────────────
// Broadcast — kirim event ke SEMUA client yang terhubung.
// Non-blocking: jika buffer client penuh, event di-drop untuk
// client tersebut (agar tidak memblokir client lain).
// ─────────────────────────────────────────────────────────────
func (h *Hub) Broadcast(eventType string, data any) {
	b, err := json.Marshal(Event{Type: eventType, Data: data})
	if err != nil {
		log.Printf("⚠️  Broadcast marshal error: %v", err)
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for ch := range h.clients {
		select {
		case ch <- b:
			// terkirim
		default:
			// buffer penuh → skip client ini (jangan block)
		}
	}
}

// ─────────────────────────────────────────────────────────────
// ClientCount — jumlah client SSE aktif saat ini.
// Dipakai di controller untuk logging.
// ─────────────────────────────────────────────────────────────
func (h *Hub) ClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

// ─────────────────────────────────────────────────────────────
// SetDebug — aktifkan / matikan logging.
// ─────────────────────────────────────────────────────────────
func (h *Hub) SetDebug(on bool) {
	h.mu.Lock()
	h.debug = on
	h.mu.Unlock()
}