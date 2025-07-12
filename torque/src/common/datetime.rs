use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fmt;
use std::str::FromStr;

/// A DateTime type that is always serialized as ISO 8601 string
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct UtcDateTime(DateTime<Utc>);

impl UtcDateTime {
    /// Create a new UtcDateTime for the current time
    pub fn now() -> Self {
        Self(Utc::now())
    }

    /// Create from a chrono DateTime<Utc>
    pub fn from_chrono(dt: DateTime<Utc>) -> Self {
        Self(dt)
    }

    /// Get the underlying chrono DateTime
    pub fn as_chrono(&self) -> &DateTime<Utc> {
        &self.0
    }

    /// Convert to chrono DateTime (consuming self)
    pub fn into_chrono(self) -> DateTime<Utc> {
        self.0
    }

    /// Convert to ISO 8601 string
    pub fn to_iso8601(&self) -> String {
        self.0.to_rfc3339()
    }

    /// Parse from ISO 8601 string
    pub fn parse_iso8601(s: &str) -> Result<Self, chrono::ParseError> {
        DateTime::parse_from_rfc3339(s)
            .map(|dt| Self(dt.with_timezone(&Utc)))
    }
}

impl fmt::Display for UtcDateTime {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.to_iso8601())
    }
}

impl FromStr for UtcDateTime {
    type Err = chrono::ParseError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Self::parse_iso8601(s)
    }
}

impl From<DateTime<Utc>> for UtcDateTime {
    fn from(dt: DateTime<Utc>) -> Self {
        Self(dt)
    }
}

impl From<UtcDateTime> for DateTime<Utc> {
    fn from(dt: UtcDateTime) -> Self {
        dt.0
    }
}

// Serialize as ISO 8601 string
impl Serialize for UtcDateTime {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_iso8601())
    }
}

// Deserialize from ISO 8601 string
impl<'de> Deserialize<'de> for UtcDateTime {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        Self::parse_iso8601(&s).map_err(serde::de::Error::custom)
    }
}

// GraphQL support
#[cfg(feature = "graphql")]
#[async_graphql::Scalar]
impl async_graphql::ScalarType for UtcDateTime {
    fn parse(value: async_graphql::Value) -> async_graphql::InputValueResult<Self> {
        if let async_graphql::Value::String(s) = &value {
            Self::parse_iso8601(s)
                .map_err(|e| async_graphql::InputValueError::custom(e.to_string()))
        } else {
            Err(async_graphql::InputValueError::custom("Expected ISO 8601 datetime string"))
        }
    }

    fn to_value(&self) -> async_graphql::Value {
        async_graphql::Value::String(self.to_iso8601())
    }
}

// SeaORM support
impl From<UtcDateTime> for sea_orm::Value {
    fn from(dt: UtcDateTime) -> Self {
        sea_orm::Value::ChronoDateTimeUtc(Some(Box::new(dt.0)))
    }
}

impl sea_orm::TryGetable for UtcDateTime {
    fn try_get_by<I: sea_orm::ColIdx>(res: &sea_orm::QueryResult, idx: I) -> Result<Self, sea_orm::TryGetError> {
        let dt = DateTime::<Utc>::try_get_by(res, idx)?;
        Ok(Self(dt))
    }
}

impl sea_orm::sea_query::ValueType for UtcDateTime {
    fn try_from(v: sea_orm::Value) -> Result<Self, sea_orm::sea_query::ValueTypeErr> {
        match v {
            sea_orm::Value::ChronoDateTimeUtc(Some(dt)) => Ok(Self(*dt)),
            _ => Err(sea_orm::sea_query::ValueTypeErr),
        }
    }

    fn type_name() -> String {
        "UtcDateTime".to_string()
    }

    fn array_type() -> sea_orm::sea_query::ArrayType {
        sea_orm::sea_query::ArrayType::ChronoDateTimeUtc
    }

    fn column_type() -> sea_orm::sea_query::ColumnType {
        sea_orm::sea_query::ColumnType::TimestampWithTimeZone
    }
}

impl sea_orm::sea_query::Nullable for UtcDateTime {
    fn null() -> sea_orm::Value {
        sea_orm::Value::ChronoDateTimeUtc(None)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_datetime_serialization() {
        let dt = UtcDateTime::now();
        let json = serde_json::to_string(&dt).unwrap();
        let deserialized: UtcDateTime = serde_json::from_str(&json).unwrap();
        assert_eq!(dt, deserialized);
    }

    #[test]
    fn test_iso8601_format() {
        let dt = UtcDateTime::now();
        let iso = dt.to_iso8601();
        let parsed = UtcDateTime::parse_iso8601(&iso).unwrap();
        assert_eq!(dt, parsed);
    }
}