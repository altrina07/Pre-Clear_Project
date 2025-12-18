using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace PreClear.Api.Models
{
    [Table("broker_profiles")]
    public class BrokerProfile
    {
        [Key]
        [Column("user_id")]
        public long UserId { get; set; }

        // License & Experience
        [Column("license_number")]
        [MaxLength(100)]
        public string? LicenseNumber { get; set; }

        [Column("years_of_experience")]
        public int? YearsOfExperience { get; set; }

        // Assignment Rules (JSON arrays)
        [Column("origin_countries", TypeName = "json")]
        public string? OriginCountriesJson { get; set; }

        [Column("destination_countries", TypeName = "json")]
        public string? DestinationCountriesJson { get; set; }

        [Column("hs_categories", TypeName = "json")]
        public string? HsCategoriesJson { get; set; }

        // Preferences
        [Column("timezone")]
        [MaxLength(50)]
        public string Timezone { get; set; } = "America/New_York";

        [Column("language")]
        [MaxLength(10)]
        public string Language { get; set; } = "en";

        // Status
        [Column("is_available")]
        public bool IsAvailable { get; set; } = true;

        [Column("max_concurrent_shipments")]
        public int MaxConcurrentShipments { get; set; } = 10;

        // Timestamps
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey("UserId")]
        public User? User { get; set; }

        // Helper properties for JSON arrays (not mapped to DB)
        [NotMapped]
        public List<string> OriginCountries
        {
            get => string.IsNullOrEmpty(OriginCountriesJson) 
                ? new List<string>() 
                : JsonSerializer.Deserialize<List<string>>(OriginCountriesJson) ?? new List<string>();
            set => OriginCountriesJson = JsonSerializer.Serialize(value);
        }

        [NotMapped]
        public List<string> DestinationCountries
        {
            get => string.IsNullOrEmpty(DestinationCountriesJson) 
                ? new List<string>() 
                : JsonSerializer.Deserialize<List<string>>(DestinationCountriesJson) ?? new List<string>();
            set => DestinationCountriesJson = JsonSerializer.Serialize(value);
        }

        [NotMapped]
        public List<string> HsCategories
        {
            get => string.IsNullOrEmpty(HsCategoriesJson) 
                ? new List<string>() 
                : JsonSerializer.Deserialize<List<string>>(HsCategoriesJson) ?? new List<string>();
            set => HsCategoriesJson = JsonSerializer.Serialize(value);
        }
    }
}
