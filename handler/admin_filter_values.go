package handler

import (
	"net/http"
	"strconv"
	"wa-ai-bot/database"
	"wa-ai-bot/groq"
	"wa-ai-bot/models"

	"github.com/gin-gonic/gin"
)

func AdminListFilterValues(c *gin.Context) {
	var values []models.FilterValue
	q := database.DB.Order("type, id")
	if t := c.Query("type"); t != "" {
		q = q.Where("type = ?", t)
	}
	if err := q.Find(&values).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, values)
}

type filterValueInput struct {
	Type    string `json:"type" binding:"required"`
	ValueEN string `json:"value_en" binding:"required"`
}

func AdminCreateFilterValue(c *gin.Context) {
	var inp filterValueInput
	if err := c.ShouldBindJSON(&inp); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	idVal, zhVal, err := groq.TranslateFilterValue(inp.ValueEN, inp.Type)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "translation failed: " + err.Error()})
		return
	}

	fv := models.FilterValue{
		Type:  inp.Type,
		Value: inp.ValueEN + "," + idVal + "," + zhVal,
	}
	if err := database.DB.Create(&fv).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, fv)
}

func AdminUpdateFilterValue(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var fv models.FilterValue
	if err := database.DB.First(&fv, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	var inp filterValueInput
	if err := c.ShouldBindJSON(&inp); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	idVal, zhVal, err := groq.TranslateFilterValue(inp.ValueEN, inp.Type)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "translation failed: " + err.Error()})
		return
	}

	fv.Type = inp.Type
	fv.Value = inp.ValueEN + "," + idVal + "," + zhVal
	if err := database.DB.Save(&fv).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, fv)
}

func AdminDeleteFilterValue(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := database.DB.Delete(&models.FilterValue{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// Public endpoint — no auth required
func GetFilterValues(c *gin.Context) {
	var values []models.FilterValue
	if err := database.DB.Order("type, id").Find(&values).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, values)
}
