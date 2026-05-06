package main

import (
    "database/sql"
    "fmt"
    _ "github.com/lib/pq"
)

func main() {
    // ЗАМЕНИТЕ postgres НА ВАШ ПАРОЛЬ
    connStr := "user=postgres password=postgres dbname=postgres host=localhost port=5432 sslmode=disable"
    
    db, err := sql.Open("postgres", connStr)
    if err != nil {
        fmt.Println("Open error:", err)
        return
    }
    defer db.Close()
    
    err = db.Ping()
    if err != nil {
        fmt.Println("Ping error:", err)
        return
    }
    
    fmt.Println("✅ Connected!")
    
    var result int
    db.QueryRow("SELECT 1").Scan(&result)
    fmt.Println("Query result:", result)
}