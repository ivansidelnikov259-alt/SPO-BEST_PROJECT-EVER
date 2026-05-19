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
    Date           string  `json:"date"`
    StartDate      string  `json:"start_date"`
    EndDate        string  `json:"end_date"`
    AvgTicketPrice float64 `json:"avg_ticket_price"`
    Currency       string  `json:"currency"`
    GroupID        int     `json:"group_id"`
    GroupName      string  `json:"group_name,omitempty"`
    CreatedBy      int     `json:"created_by"`
    CreatedAt      string  `json:"created_at"`
}

type TourCreate struct {
    ProgramName    string  `json:"program_name" binding:"required"`
    City           string  `json:"city" binding:"required"`
    Date           string  `json:"date" binding:"required"`
    StartDate      string  `json:"start_date" binding:"required"`
    EndDate        string  `json:"end_date" binding:"required"`
    AvgTicketPrice float64 `json:"avg_ticket_price" binding:"required"`
    Currency       string  `json:"currency"`
    GroupID        int     `json:"group_id" binding:"required"`
}

type TourUpdate struct {
    ProgramName    string   `json:"program_name"`
    City           string   `json:"city"`
    Date           string   `json:"date"`
    StartDate      string   `json:"start_date"`
    EndDate        string   `json:"end_date"`
    AvgTicketPrice *float64 `json:"avg_ticket_price"`
    Currency       string   `json:"currency"`
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

func validateDate(date string) bool {
    _, err := time.Parse("2006-01-02", date)
    return err == nil
}

func validateDateInRange(date, startDate, endDate string) bool {
    d, _ := time.Parse("2006-01-02", date)
    start, _ := time.Parse("2006-01-02", startDate)
    end, _ := time.Parse("2006-01-02", endDate)
    return (d.Equal(start) || d.After(start)) && (d.Equal(end) || d.Before(end))
}

func validateDates(startDate, endDate string) bool {
    start, err1 := time.Parse("2006-01-02", startDate)
    end, err2 := time.Parse("2006-01-02", endDate)
    if err1 != nil || err2 != nil {
        return false
    }
    return !end.Before(start)
}

func getUserID(c *gin.Context) int {
    userIDHeader := c.GetHeader("X-User-Id")
    if userIDHeader == "" {
        return 0
    }
    userID, _ := strconv.Atoi(userIDHeader)
    return userID
}

func getTours(c *gin.Context) {
    userID := getUserID(c)
    userRole := c.GetHeader("X-User-Role")

    var query string
    var params []interface{}

    if userRole == "admin" {
        query = `
            SELECT t.id, t.program_name, t.city, t.date, t.start_date, t.end_date, 
                   t.avg_ticket_price, COALESCE(t.currency, 'USD'), t.group_id, t.created_at, g.name as group_name,
                   COALESCE(t.created_by, 1) as created_by
            FROM tours t 
            JOIN groups g ON t.group_id = g.id 
            ORDER BY t.date DESC
        `
    } else {
        query = `
            SELECT t.id, t.program_name, t.city, t.date, t.start_date, t.end_date, 
                   t.avg_ticket_price, COALESCE(t.currency, 'USD'), t.group_id, t.created_at, g.name as group_name,
                   COALESCE(t.created_by, 1) as created_by
            FROM tours t 
            JOIN groups g ON t.group_id = g.id 
            WHERE COALESCE(t.created_by, 1) = $1
            ORDER BY t.date DESC
        `
        params = append(params, userID)
    }

    rows, err := db.Query(query, params...)
    if err != nil {
        log.Printf("Error querying tours: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    defer rows.Close()

    var tours []Tour
    for rows.Next() {
        var tour Tour
        err := rows.Scan(&tour.ID, &tour.ProgramName, &tour.City, &tour.Date, &tour.StartDate,
            &tour.EndDate, &tour.AvgTicketPrice, &tour.Currency, &tour.GroupID, &tour.CreatedAt, &tour.GroupName, &tour.CreatedBy)
        if err != nil {
            log.Printf("Error scanning tour: %v", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
        tours = append(tours, tour)
    }

    c.JSON(http.StatusOK, tours)
}

func getTour(c *gin.Context) {
    userID := getUserID(c)
    userRole := c.GetHeader("X-User-Role")

    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tour ID"})
        return
    }

    var tour Tour
    query := `
        SELECT t.id, t.program_name, t.city, t.date, t.start_date, t.end_date, 
               t.avg_ticket_price, COALESCE(t.currency, 'USD'), t.group_id, t.created_at, g.name as group_name,
               COALESCE(t.created_by, 1) as created_by
        FROM tours t 
        JOIN groups g ON t.group_id = g.id 
        WHERE t.id = $1
    `
    err = db.QueryRow(query, id).Scan(&tour.ID, &tour.ProgramName, &tour.City, &tour.Date, &tour.StartDate,
        &tour.EndDate, &tour.AvgTicketPrice, &tour.Currency, &tour.GroupID, &tour.CreatedAt, &tour.GroupName, &tour.CreatedBy)

    if err == sql.ErrNoRows {
        c.JSON(http.StatusNotFound, gin.H{"error": "Tour not found"})
        return
    }
    if err != nil {
        log.Printf("Error getting tour: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    if userRole != "admin" && tour.CreatedBy != userID {
        c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
        return
    }

    c.JSON(http.StatusOK, tour)
}

func createTour(c *gin.Context) {
    userID := getUserID(c)
    userRole := c.GetHeader("X-User-Role")

    var tour TourCreate
    if err := c.ShouldBindJSON(&tour); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    if tour.Currency == "" {
        tour.Currency = "USD"
    }

    if !validateDate(tour.Date) || !validateDates(tour.StartDate, tour.EndDate) {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format"})
        return
    }

    if !validateDateInRange(tour.Date, tour.StartDate, tour.EndDate) {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Concert date must be within tour period"})
        return
    }

    var groupCreatedBy int
    err := db.QueryRow("SELECT COALESCE(created_by, 1) FROM groups WHERE id = $1", tour.GroupID).Scan(&groupCreatedBy)
    if err == sql.ErrNoRows {
        c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
        return
    }
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    if userRole != "admin" && groupCreatedBy != userID {
        c.JSON(http.StatusForbidden, gin.H{"error": "You can only add tours to your own groups"})
        return
    }

    var newTour Tour
    query := `
        INSERT INTO tours (program_name, city, date, start_date, end_date, avg_ticket_price, currency, group_id, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, program_name, city, date, start_date, end_date, avg_ticket_price, currency, group_id, created_at
    `
    err = db.QueryRow(query, tour.ProgramName, tour.City, tour.Date, tour.StartDate,
        tour.EndDate, tour.AvgTicketPrice, tour.Currency, tour.GroupID, userID).Scan(
        &newTour.ID, &newTour.ProgramName, &newTour.City, &newTour.Date, &newTour.StartDate,
        &newTour.EndDate, &newTour.AvgTicketPrice, &newTour.Currency, &newTour.GroupID, &newTour.CreatedAt)
    newTour.CreatedBy = userID

    if err != nil {
        log.Printf("Error creating tour: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    db.QueryRow("SELECT name FROM groups WHERE id = $1", tour.GroupID).Scan(&newTour.GroupName)

    c.JSON(http.StatusCreated, newTour)
}

func updateTour(c *gin.Context) {
    userID := getUserID(c)
    userRole := c.GetHeader("X-User-Role")

    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tour ID"})
        return
    }

    var createdBy int
    err = db.QueryRow("SELECT COALESCE(created_by, 1) FROM tours WHERE id = $1", id).Scan(&createdBy)
    if err == sql.ErrNoRows {
        c.JSON(http.StatusNotFound, gin.H{"error": "Tour not found"})
        return
    }
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    if userRole != "admin" && createdBy != userID {
        c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
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
    if updates.Date != "" {
        query += fmt.Sprintf("date = $%d, ", paramCount)
        params = append(params, updates.Date)
        paramCount++
    }
    if updates.StartDate != "" {
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
    if updates.Currency != "" {
        query += fmt.Sprintf("currency = $%d, ", paramCount)
        params = append(params, updates.Currency)
        paramCount++
    }
    if updates.GroupID != nil {
        var groupCreatedBy int
        err = db.QueryRow("SELECT COALESCE(created_by, 1) FROM groups WHERE id = $1", *updates.GroupID).Scan(&groupCreatedBy)
        if err == sql.ErrNoRows {
            c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
            return
        }
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
        if userRole != "admin" && groupCreatedBy != userID {
            c.JSON(http.StatusForbidden, gin.H{"error": "You can only assign tours to your own groups"})
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

    query = query[:len(query)-2] + fmt.Sprintf(" WHERE id = $%d RETURNING id, program_name, city, date, start_date, end_date, avg_ticket_price, currency, group_id, created_at", paramCount)
    params = append(params, id)

    var updatedTour Tour
    err = db.QueryRow(query, params...).Scan(&updatedTour.ID, &updatedTour.ProgramName, &updatedTour.City,
        &updatedTour.Date, &updatedTour.StartDate, &updatedTour.EndDate, &updatedTour.AvgTicketPrice,
        &updatedTour.Currency, &updatedTour.GroupID, &updatedTour.CreatedAt)
    updatedTour.CreatedBy = createdBy

    if err == sql.ErrNoRows {
        c.JSON(http.StatusNotFound, gin.H{"error": "Tour not found"})
        return
    }
    if err != nil {
        log.Printf("Error updating tour: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    db.QueryRow("SELECT name FROM groups WHERE id = $1", updatedTour.GroupID).Scan(&updatedTour.GroupName)

    c.JSON(http.StatusOK, updatedTour)
}

func deleteTour(c *gin.Context) {
    userID := getUserID(c)
    userRole := c.GetHeader("X-User-Role")

    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tour ID"})
        return
    }

    var createdBy int
    err = db.QueryRow("SELECT COALESCE(created_by, 1) FROM tours WHERE id = $1", id).Scan(&createdBy)
    if err == sql.ErrNoRows {
        c.JSON(http.StatusNotFound, gin.H{"error": "Tour not found"})
        return
    }
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    if userRole != "admin" && createdBy != userID {
        c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
        return
    }

    result, err := db.Exec("DELETE FROM tours WHERE id = $1", id)
    if err != nil {
        log.Printf("Error deleting tour: %v", err)
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
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-User-Id", "X-User-Role"},
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