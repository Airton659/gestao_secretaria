using System.Data;

namespace Secretaria.Api.Data;

public interface IDbConnectionFactory
{
    IDbConnection Create();
}
