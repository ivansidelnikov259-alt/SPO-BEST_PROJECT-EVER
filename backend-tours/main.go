package main

import (
    "database/sql"
    "fmt"
    "log"
    "net/http"
    "os"
    "strconv"
    "time"

    "github.com/gin-contrib/cors"
    "github.com/gin-gonic/gin"
    _ "github.com/lib/pq"
)

type Tour struct {
    ID             int     `json:"id"`
    ProgramName    string  `json:"program_name"`
    City           string  `json:"city"`
    StartDate      string  `json:"start_date"`
    EndDate        string  `json:"end_date"`
    AvgTicketPrice float64 `json:"avg_ticket_price"`
    GroupID        int     `json:"group_id"`
    GroupName      string  `json:"group_name,omitempty"`
    CreatedAt      string  `json:"created_at"`
}

type TourCreate struct {
    ProgramName    string  `json:"program_name" binding:"required"`
    City           string  `json:"city" binding:"required"`
    StartDate      string  `json:"start_date" binding:"required"`
    EndDate        string  `json:"end_date" binding:"required"`
    AvgTicketPrice float64 `json:"avg_ticket_price" binding:"required"`
    GroupID        int     `json:"group_id" binding:"required"`
}

type TourUpdate struct {
    ProgramName    string   `json:"program_name"`
    City           string   `json:"city"`
    StartDate      string   `json:"start_date"`
    EndDate        string   `json:"end_date"`
    AvgTicketPrice *float64 `json:"avg_ticket_price"`
    GroupID        *int     `json:"group_id"`
}

var db *sql.DB

func initDB() {
    host := os.Getenv("DB_HOST")
    if host == "" {
        host = "localhost"
    }
    port := os.Getenv("DB_PORT")
    if port == "" {
        port = "5432"
    }
    user := os.Getenv("DB_USER")
    if user == "" {
        user = "postgres"
    }
    password := os.Getenv("DB_PASSWORD")
    if password == "" {
        password = "postgres"
    }
    dbname := os.Getenv("DB_NAME")
    if dbname == "" {
        dbname = "music_manager"
    }

    connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
        host, port, user, password, dbname)

    var err error
    db, err = sql.Open("postgres", connStr)
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }

    err = db.Ping()
    if err != nil {
        log.Fatal("Failed to ping database:", err)
    }

    log.Println("✅ Database connected successfully")
}

func validateDates(startDate, endDate string) bool {
    start, err1 := time.Parse("2006-01-02", startDate)
    end, err2 := time.Parse("2006-01-02", endDate)
    if err1 != nil || err2 != nil {
        return false
    }
    return !end.Before(start)
}

func getTours(c *gin.Context) {
    query := `
        SELECT t.*, g.name as group_name 
        FROM tours t 
        JOIN groups g ON t.group_id = g.id 
        ORDER BY t.start_date DESC
    `
    rows, err := db.Query(query)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    defer rows.Close()

    var tours []Tour
    for rows.Next() {
        var tour Tour
        err := rows.Scan(&tour.ID, &tour.ProgramName, &tour.City, &tour.StartDate,
            &tour.EndDate, &tour.AvgTicketPrice, &tour.GroupID, &tour.CreatedAt, &tour.GroupName)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
        tours = append(tours, tour)
    }

    c.JSON(http.StatusOK, tours)
}

func getTour(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tour ID"})
        return
    }

    var tour Tour
    query := `
        SELECT t.*, g.name as group_name 
        FROM tours t 
        JOIN groups g ON t.group_id = g.id 
        WHERE t.id = $1
    `
    err = db.QueryRow(query, id).Scan(&tour.ID, &tour.ProgramName, &tour.City,
        &tour.StartDate, &tour.EndDate, &tour.AvgTicketPrice, &tour.GroupID,
        &tour.CreatedAt, &tour.GroupName)

    if err == sql.ErrNoRows {
        c.JSON(http.StatusNotFound, gin.H{"error": "Tour not found"})
        return
    }
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, tour)
}

func createTour(c *gin.Context) {
    var tour TourCreate
    if err := c.ShouldBindJSON(&tour); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    if !validateDates(tour.StartDate, tour.EndDate) {
        c.JSON(http.StatusBadRequest, gin.H{"error": "End date must be after start date"})
        return
    }

    var exists bool
    err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM groups WHERE id = $1)", tour.GroupID).Scan(&exists)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    if !exists {
        c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
        return
    }

    var newTour Tour
    query := `
        INSERT INTO tours (program_name, city, start_date, end_date, avg_ticket_price, group_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, program_name, city, start_date, end_date, avg_ticket_price, group_id, created_at
    `
    err = db.QueryRow(query, tour.ProgramName, tour.City, tour.StartDate,
        tour.EndDate, tour.AvgTicketPrice, tour.GroupID).Scan(
        &newTour.ID, &newTour.ProgramName, &newTour.City, &newTour.StartDate,
        &newTour.EndDate, &newTour.AvgTicketPrice, &newTour.GroupID, &newTour.CreatedAt)

    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusCreated, newTour)
}

func updateTour(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tour ID"})
        return
    }

    var updates TourUpdate
    if err := c.ShouldBindJSON(&updates); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    query := "UPDATE tours SET "
    params := []interface{}{}
    paramCount := 1

    if updates.ProgramName != "" {
        query += fmt.Sprintf("program_name = $%d, ", paramCount)
        params = append(params, updates.ProgramName)
        paramCount++
    }
    if updates.City != "" {
        query += fmt.Sprintf("city = $%d, ", paramCount)
        params = append(params, updates.City)
        paramCount++
    }
    if updates.StartDate != "" {
        if updates.EndDate != "" && !validateDates(updates.StartDate, updates.EndDate) {
            c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date range"})
            return
        }
        query += fmt.Sprintf("start_date = $%d, ", paramCount)
        params = append(params, updates.StartDate)
        paramCount++
    }
    if updates.EndDate != "" {
        query += fmt.Sprintf("end_date = $%d, ", paramCount)
        params = append(params, updates.EndDate)
        paramCount++
    }
    if updates.AvgTicketPrice != nil {
        query += fmt.Sprintf("avg_ticket_price = $%d, ", paramCount)
        params = append(params, *updates.AvgTicketPrice)
        paramCount++
    }
    if updates.GroupID != nil {
        var exists bool
        err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM groups WHERE id = $1)", *updates.GroupID).Scan(&exists)
        if err != nil || !exists {
            c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
            return
        }
        query += fmt.Sprintf("group_id = $%d, ", paramCount)
        params = append(params, *updates.GroupID)
        paramCount++
    }

    if len(params) == 0 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
        return
    }

    query = query[:len(query)-2] + fmt.Sprintf(" WHERE id = $%d RETURNING id, program_name, city, start_date, end_date, avg_ticket_price, group_id, created_at", paramCount)
    params = append(params, id)

    var updatedTour Tour
    err = db.QueryRow(query, params...).Scan(&updatedTour.ID, &updatedTour.ProgramName, &updatedTour.City,
        &updatedTour.StartDate, &updatedTour.EndDate, &updatedTour.AvgTicketPrice,
        &updatedTour.GroupID, &updatedTour.CreatedAt)

    if err == sql.ErrNoRows {
        c.JSON(http.StatusNotFound, gin.H{"error": "Tour not found"})
        return
    }
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, updatedTour)
}

func deleteTour(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tour ID"})
        return
    }

    result, err := db.Exec("DELETE FROM tours WHERE id = $1", id)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    rows, _ := result.RowsAffected()
    if rows == 0 {
        c.JSON(http.StatusNotFound, gin.H{"error": "Tour not found"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Tour deleted successfully"})
}

func main() {
    initDB()
    defer db.Close()

    router := gin.Default()

    router.Use(cors.New(cors.Config{
        AllowOrigins:     []string{"*"},
        AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
        ExposeHeaders:    []string{"Content-Length"},
        AllowCredentials: true,
    }))

    api := router.Group("/api")
    {
        api.GET("/tours", getTours)
        api.GET("/tours/:id", getTour)
        api.POST("/tours", createTour)
        api.PUT("/tours/:id", updateTour)
        api.DELETE("/tours/:id", deleteTour)
    }

    port := os.Getenv("PORT")
    if port == "" {
        port = "8003"
    }

    log.Printf("🚀 Tours microservice running on port %s", port)
    router.Run(":" + port)
}