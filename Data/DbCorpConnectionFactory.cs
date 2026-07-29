using System.Data;
using System.Data.Odbc;

namespace Secretaria.Api.Data;

public class DbCorpConnectionFactory : IDbCorpConnectionFactory
{
    private readonly string _connectionString;

    public DbCorpConnectionFactory(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("CorpConnection")
            ?? throw new InvalidOperationException("Connection string 'CorpConnection' not found.");
    }

    public IDbConnection Create() => new OdbcConnection(_connectionString);
}
