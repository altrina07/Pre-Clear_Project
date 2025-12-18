using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PreClear.Api.Data;
using PreClear.Api.Models;

namespace PreClear.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // SECURITY: Require authentication for all user endpoints
    public class UsersController : ControllerBase
    {
        private readonly PreclearDbContext _db;
        public UsersController(PreclearDbContext db) => _db = db;

        private long GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            return long.TryParse(claim?.Value, out var id) ? id : 0;
        }

        // GET: api/users (only admin can list all users)
        [HttpGet]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<IEnumerable<User>>> GetAll()
        {
            return await _db.Users.AsNoTracking().ToListAsync();
        }

        // GET: api/users/{id} - Users can only get their own profile; admins can get any
        [HttpGet("{id:long}")]
        public async Task<ActionResult<User>> Get(long id)
        {
            var currentUserId = GetUserId();
            var isAdmin = User.IsInRole("admin");

            // Only allow user to view their own profile OR if admin
            if (currentUserId != id && !isAdmin)
                return Forbid("Cannot view other users' profiles");

            var user = await _db.Users.FindAsync(id);
            if (user == null) return NotFound();
            return user;
        }

        // POST: api/users (admin only - new user registration should go through auth)
        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<User>> Create(User input)
        {
            // NOTE: in prod hash password and validate input
            input.CreatedAt = input.UpdatedAt = System.DateTime.UtcNow;
            _db.Users.Add(input);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = input.Id }, input);
        }

        // PUT: api/users/{id} - Users can only update their own; admins can update any
        [HttpPut("{id:long}")]
        public async Task<IActionResult> Update(long id, User input)
        {
            var currentUserId = GetUserId();
            var isAdmin = User.IsInRole("admin");

            // Only allow user to update their own profile OR if admin
            if (currentUserId != id && !isAdmin)
                return Forbid("Cannot update other users' profiles");

            var user = await _db.Users.FindAsync(id);
            if (user == null) return NotFound();

            // selective updates (avoid overwriting password_hash unless provided)
            user.FirstName = input.FirstName;
            user.LastName = input.LastName;
            user.Phone = input.Phone;
            user.Company = input.Company;
            
            // Only admins can change role
            if (isAdmin && !string.IsNullOrWhiteSpace(input.Role))
                user.Role = input.Role;
            
            user.IsActive = input.IsActive;
            user.UpdatedAt = System.DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/users/{id} (admin only)
        [HttpDelete("{id:long}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Delete(long id)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) return NotFound();
            _db.Users.Remove(user);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
