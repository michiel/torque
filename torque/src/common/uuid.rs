use serde::{Deserialize, Serialize};
use std::fmt;
use std::str::FromStr;

/// A UUID type that is always stored as a string, avoiding conversions between layers
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct Uuid(String);

impl Uuid {
    /// Generate a new v4 UUID
    pub fn new_v4() -> Self {
        Self(uuid::Uuid::new_v4().to_string())
    }

    /// Create a UUID from a string, validating the format
    pub fn parse(s: &str) -> Result<Self, uuid::Error> {
        // Validate the string is a valid UUID format
        uuid::Uuid::parse_str(s)?;
        Ok(Self(s.to_string()))
    }

    /// Get the UUID as a string slice
    pub fn as_str(&self) -> &str {
        &self.0
    }

    /// Convert to a standard uuid::Uuid if needed for legacy code
    pub fn to_uuid(&self) -> uuid::Uuid {
        // This should never panic because we validate on construction
        uuid::Uuid::parse_str(&self.0).expect("Invalid UUID stored")
    }
}

impl fmt::Display for Uuid {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl FromStr for Uuid {
    type Err = uuid::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Self::parse(s)
    }
}

impl From<uuid::Uuid> for Uuid {
    fn from(uuid: uuid::Uuid) -> Self {
        Self(uuid.to_string())
    }
}

impl AsRef<str> for Uuid {
    fn as_ref(&self) -> &str {
        &self.0
    }
}

// GraphQL support
#[cfg(feature = "graphql")]
#[async_graphql::Scalar]
impl async_graphql::ScalarType for Uuid {
    fn parse(value: async_graphql::Value) -> async_graphql::InputValueResult<Self> {
        if let async_graphql::Value::String(s) = &value {
            Self::parse(s)
                .map_err(|e| async_graphql::InputValueError::custom(e.to_string()))
        } else {
            Err(async_graphql::InputValueError::custom("Expected string"))
        }
    }

    fn to_value(&self) -> async_graphql::Value {
        async_graphql::Value::String(self.0.clone())
    }
}

// SeaORM support
impl From<Uuid> for sea_orm::Value {
    fn from(uuid: Uuid) -> Self {
        sea_orm::Value::String(Some(Box::new(uuid.0)))
    }
}

impl sea_orm::TryGetable for Uuid {
    fn try_get_by<I: sea_orm::ColIdx>(res: &sea_orm::QueryResult, idx: I) -> Result<Self, sea_orm::TryGetError> {
        let s = String::try_get_by(res, idx)?;
        Self::parse(&s)
            .map_err(|_| sea_orm::TryGetError::DbErr(sea_orm::DbErr::Type("Invalid UUID format".to_string())))
    }
}

impl sea_orm::sea_query::ValueType for Uuid {
    fn try_from(v: sea_orm::Value) -> Result<Self, sea_orm::sea_query::ValueTypeErr> {
        match v {
            sea_orm::Value::String(Some(s)) => {
                Self::parse(&s).map_err(|_| sea_orm::sea_query::ValueTypeErr)
            }
            _ => Err(sea_orm::sea_query::ValueTypeErr),
        }
    }

    fn type_name() -> String {
        "Uuid".to_string()
    }

    fn array_type() -> sea_orm::sea_query::ArrayType {
        sea_orm::sea_query::ArrayType::String
    }

    fn column_type() -> sea_orm::sea_query::ColumnType {
        sea_orm::sea_query::ColumnType::String(Some(36))
    }
}

impl sea_orm::sea_query::Nullable for Uuid {
    fn null() -> sea_orm::Value {
        sea_orm::Value::String(None)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_uuid_creation() {
        let uuid1 = Uuid::new_v4();
        let uuid2 = Uuid::new_v4();
        assert_ne!(uuid1, uuid2);
    }

    #[test]
    fn test_uuid_parse() {
        let uuid_str = "550e8400-e29b-41d4-a716-446655440000";
        let uuid = Uuid::parse(uuid_str).unwrap();
        assert_eq!(uuid.as_str(), uuid_str);
    }

    #[test]
    fn test_invalid_uuid() {
        let result = Uuid::parse("not-a-uuid");
        assert!(result.is_err());
    }

    #[test]
    fn test_serialization() {
        let uuid = Uuid::new_v4();
        let json = serde_json::to_string(&uuid).unwrap();
        let deserialized: Uuid = serde_json::from_str(&json).unwrap();
        assert_eq!(uuid, deserialized);
    }
}