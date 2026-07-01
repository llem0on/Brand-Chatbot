package models

type FilterValue struct {
	ID    uint   `gorm:"primaryKey" json:"id"`
	Type  string `gorm:"type:varchar(50);not null;index" json:"type"`  // color | gender | category | material | size
	Value string `gorm:"type:varchar(300);not null" json:"value"`     // "English,Indonesian,Mandarin"
}
