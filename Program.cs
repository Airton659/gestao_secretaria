using Dapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Secretaria.Api.Configuration;
using Secretaria.Api.DTOs.Perfis;
using Secretaria.Api.Middleware;
using Secretaria.Api.Repositories.Interfaces;

DefaultTypeMap.MatchNamesWithUnderscores = true;
System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Secretaria API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new()
    {
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "Token JWT emitido pelo Keycloak"
    });
    c.AddSecurityRequirement(new()
    {
        {
            new() { Reference = new() { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath)) c.IncludeXmlComments(xmlPath);
});

// JWT via Keycloak JWKS
var keycloakAuthority = builder.Configuration["Keycloak:Authority"]
    ?? throw new InvalidOperationException("Keycloak:Authority não configurado.");
var keycloakMetadataAddress = builder.Configuration["Keycloak:MetadataAddress"];

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = keycloakAuthority;
        if (!string.IsNullOrWhiteSpace(keycloakMetadataAddress))
            options.MetadataAddress = keycloakMetadataAddress;
        options.RequireHttpsMetadata = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer   = true,
            ValidIssuer      = keycloakAuthority,
            ValidateAudience = false,
            ClockSkew        = TimeSpan.Zero,
            NameClaimType    = "preferred_username",
        };
    });

builder.Services.AddAuthorization();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("Dev", policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod());

    options.AddPolicy("Prod", policy =>
        policy.WithOrigins(
            builder.Configuration["AppSettings:FrontendUrl"] ?? "https://secretaria.funcesi.br")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

app.UseMiddleware<ErrorHandlingMiddleware>();

// Seed: garante que o perfil "Admin" existe na base
try
{
    using var scope = app.Services.CreateScope();
    var perfisRepo = scope.ServiceProvider.GetRequiredService<IPerfilAcessoRepository>();
    var todos = await perfisRepo.GetAllAsync();
    if (!todos.Any(p => p.Nome.Equals("Admin", StringComparison.OrdinalIgnoreCase)))
        await perfisRepo.CreateAsync(new PerfilAcessoRequest { Nome = "Admin", Permissoes = "{}" });
}
catch (Exception ex)
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogWarning(ex, "Seed do perfil Admin falhou — o app continuará sem ele.");
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseCors("Dev");
}
else
{
    app.UseCors("Prod");
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

