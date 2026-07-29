using System.Data;

namespace Secretaria.Api.Data;

public interface IDbCorpConnectionFactory
{
    IDbConnection Create();
}
