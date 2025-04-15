package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"database/sql"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

type ZoomMeetingRequest struct {
	Topic      string    `json:"topic"`
	StartTime  time.Time `json:"start_time"`
	Duration   int       `json:"duration"`
	Timezone   string    `json:"timezone"`
	Password   string    `json:"password"`
	Settings   map[string]interface{} `json:"settings,omitempty"`
}

type ZoomMeetingResponse struct {
	ID             int    `json:"id"`
	UUID           string `json:"uuid"`
	HostID         string `json:"host_id"`
	JoinURL        string `json:"join_url"`
	StartURL       string `json:"start_url"`
	Topic          string `json:"topic"`
	StartTime      string `json:"start_time"`
	Duration       int    `json:"duration"`
	Timezone       string `json:"timezone"`
	CreatedAt      string `json:"created_at"`
	Password       string `json:"password"`
	H323Password   string `json:"h323_password"`
	Pmi            int    `json:"pmi"`
	MeetingType    int    `json:"type"`
	Status         string `json:"status"`
	EncryptedPassword string `json:"encrypted_password"`
	Settings       map[string]interface{} `json:"settings"`
}

func main() {
	godotenv.Load()

	http.HandleFunc("/api/create-meeting", createMeetingHandler)

	fmt.Println("Go backend server is running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func createMeetingHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ZoomMeetingRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	zoomAPIKey := os.Getenv("ZOOM_API_KEY")
	zoomAPISecret := os.Getenv("ZOOM_API_SECRET")
	zoomEndpoint := "https://api.zoom.us/v2/users/rizkyadhiguna/meetings"

	zoomRequestBody := map[string]interface{}{
		"topic":      req.Topic,
		"start_time": req.StartTime.Format(time.RFC3339),
		"duration":   req.Duration,
		"timezone":   req.Timezone,
		"password":   req.Password,
		"settings":   req.Settings,
	}
	zoomRequestBodyJSON, _ := json.Marshal(zoomRequestBody)

	client := &http.Client{}
	zoomReq, err := http.NewRequest("POST", zoomEndpoint, bytes.NewBuffer(zoomRequestBodyJSON))
	if err != nil {
		http.Error(w, "Failed to create Zoom API request", http.StatusInternalServerError)
		log.Println("Error creating Zoom API request:", err)
		return
	}

	jwtToken := generateJWT(zoomAPIKey, zoomAPISecret)
	zoomReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", jwtToken))
	zoomReq.Header.Set("Content-Type", "application/json")

	zoomRes, err := client.Do(zoomReq)
	if err != nil {
		http.Error(w, "Failed to call Zoom API", http.StatusInternalServerError)
		log.Println("Error calling Zoom API:", err)
		return
	}
	defer zoomRes.Body.Close()

	if zoomRes.StatusCode != http.StatusCreated {
		var errorResponse map[string]interface{}
		json.NewDecoder(zoomRes.Body).Decode(&errorResponse)
		log.Printf("Zoom API Error: Status %d, Response: %+v", zoomRes.StatusCode, errorResponse)
		http.Error(w, fmt.Sprintf("Failed to create Zoom meeting: Status %d", zoomRes.StatusCode), http.StatusInternalServerError)
		return
	}

	var zoomResponse ZoomMeetingResponse
	err = json.NewDecoder(zoomRes.Body).Decode(&zoomResponse)
	if err != nil {
		http.Error(w, "Failed to parse Zoom API response", http.StatusInternalServerError)
		log.Println("Error parsing Zoom API response:", err)
		return
	}

	dbURL := os.Getenv("DATABASE_URL")
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		http.Error(w, "Failed to connect to database", http.StatusInternalServerError)
		log.Println("Error connecting to database:", err)
		return
	}
	defer db.Close()

	_, err = db.Exec(`
		INSERT INTO zoom_meetings (zoom_meeting_id, topic, start_time, duration, join_url, start_url, created_at, password)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`, zoomResponse.ID, zoomResponse.Topic, zoomResponse.StartTime, zoomResponse.Duration, zoomResponse.JoinURL, zoomResponse.StartURL, zoomResponse.CreatedAt, zoomResponse.Password)
	if err != nil {
		http.Error(w, "Failed to save meeting to database", http.StatusInternalServerError)
		log.Println("Error saving meeting to database:", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(zoomResponse)
}

func generateJWT(apiKey, apiSecret string) string {
	header := `{"alg": "HS256", "typ": "JWT"}`
	payload := fmt.Sprintf(`{"iss": "%s", "exp": %d}`, apiKey, time.Now().Add(time.Minute*120).Unix())

	unsignedToken := base64Encode(header) + "." + base64Encode(payload)
	signature := sign(unsignedToken, apiSecret)
	return unsignedToken + "." + signature
}

func base64Encode(src string) string {
	return fmt.Sprintf("base64(%s)", src)
}

func sign(data, key string) string {
	return fmt.Sprintf("sign(%s, %s)", data, key)
}